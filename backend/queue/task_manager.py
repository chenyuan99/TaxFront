"""
Firebase Task Queue Manager for TaxFront
Manages different types of tasks using Firestore collections as queues
"""

import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from firebase_admin import firestore
from firebase_functions import firestore_fn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskType(Enum):
    """Enumeration of different task types"""
    DOCUMENT_PROCESSING = "document_processing"
    FORM_GENERATION = "form_generation"
    AI_ANALYSIS = "ai_analysis"
    TAX_CALCULATION = "tax_calculation"
    NOTIFICATION = "notification"
    BACKUP = "backup"
    CLEANUP = "cleanup"

class TaskStatus(Enum):
    """Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRY = "retry"

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Task:
    """Task data structure"""
    id: str
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    user_id: str
    payload: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    timeout_seconds: int = 300  # 5 minutes default

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary for Firestore storage"""
        data = asdict(self)
        # Convert enums to strings
        data['type'] = self.type.value
        data['status'] = self.status.value
        data['priority'] = self.priority.value
        # Convert datetime objects to ISO strings
        for field in ['created_at', 'updated_at', 'scheduled_at', 'started_at', 'completed_at']:
            if data[field]:
                data[field] = data[field].isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create task from dictionary"""
        # Convert string enums back to enum objects
        data['type'] = TaskType(data['type'])
        data['status'] = TaskStatus(data['status'])
        data['priority'] = TaskPriority(data['priority'])
        # Convert ISO strings back to datetime objects
        for field in ['created_at', 'updated_at', 'scheduled_at', 'started_at', 'completed_at']:
            if data[field]:
                data[field] = datetime.fromisoformat(data[field])
        return cls(**data)

class TaskQueue:
    """Firebase-based task queue manager"""
    
    def __init__(self, db: firestore.Client):
        self.db = db
        self.tasks_collection = 'task_queue'
        self.processing_collection = 'task_processing'
        self.completed_collection = 'task_completed'
        self.failed_collection = 'task_failed'

    def enqueue_task(
        self,
        task_type: TaskType,
        user_id: str,
        payload: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        scheduled_at: Optional[datetime] = None,
        max_retries: int = 3,
        timeout_seconds: int = 300
    ) -> str:
        """Add a new task to the queue"""
        
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        task = Task(
            id=task_id,
            type=task_type,
            status=TaskStatus.PENDING,
            priority=priority,
            user_id=user_id,
            payload=payload,
            created_at=now,
            updated_at=now,
            scheduled_at=scheduled_at or now,
            max_retries=max_retries,
            timeout_seconds=timeout_seconds
        )
        
        # Store task in Firestore
        self.db.collection(self.tasks_collection).document(task_id).set(task.to_dict())
        
        logger.info(f"Enqueued task {task_id} of type {task_type.value} for user {user_id}")
        return task_id

    def get_next_task(self, task_types: Optional[List[TaskType]] = None) -> Optional[Task]:
        """Get the next available task from the queue"""
        
        query = self.db.collection(self.tasks_collection)\
            .where('status', '==', TaskStatus.PENDING.value)\
            .where('scheduled_at', '<=', datetime.now().isoformat())\
            .order_by('priority', direction=firestore.Query.DESCENDING)\
            .order_by('created_at')\
            .limit(1)
        
        # Filter by task types if specified
        if task_types:
            type_values = [t.value for t in task_types]
            query = query.where('type', 'in', type_values)
        
        docs = query.stream()
        
        for doc in docs:
            task_data = doc.to_dict()
            task = Task.from_dict(task_data)
            
            # Try to claim the task by updating its status
            try:
                doc.reference.update({
                    'status': TaskStatus.IN_PROGRESS.value,
                    'started_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                })
                
                # Move task to processing collection
                self.db.collection(self.processing_collection).document(task.id).set(task_data)
                
                logger.info(f"Claimed task {task.id} of type {task.type.value}")
                return task
                
            except Exception as e:
                logger.warning(f"Failed to claim task {task.id}: {e}")
                continue
        
        return None

    def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None):
        """Mark a task as completed"""
        
        now = datetime.now()
        update_data = {
            'status': TaskStatus.COMPLETED.value,
            'completed_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        
        if result:
            update_data['result'] = result
        
        # Update task in processing collection
        processing_ref = self.db.collection(self.processing_collection).document(task_id)
        processing_doc = processing_ref.get()
        
        if processing_doc.exists:
            processing_ref.update(update_data)
            
            # Move to completed collection
            task_data = processing_doc.to_dict()
            task_data.update(update_data)
            self.db.collection(self.completed_collection).document(task_id).set(task_data)
            
            # Remove from processing and queue collections
            processing_ref.delete()
            self.db.collection(self.tasks_collection).document(task_id).delete()
            
            logger.info(f"Completed task {task_id}")
        else:
            logger.warning(f"Task {task_id} not found in processing collection")

    def fail_task(self, task_id: str, error_message: str, retry: bool = True):
        """Mark a task as failed and optionally retry"""
        
        processing_ref = self.db.collection(self.processing_collection).document(task_id)
        processing_doc = processing_ref.get()
        
        if not processing_doc.exists:
            logger.warning(f"Task {task_id} not found in processing collection")
            return
        
        task_data = processing_doc.to_dict()
        task = Task.from_dict(task_data)
        
        now = datetime.now()
        task.retry_count += 1
        task.error_message = error_message
        task.updated_at = now
        
        if retry and task.retry_count <= task.max_retries:
            # Retry the task with exponential backoff
            delay_minutes = 2 ** task.retry_count  # 2, 4, 8 minutes
            task.scheduled_at = now + timedelta(minutes=delay_minutes)
            task.status = TaskStatus.RETRY
            
            # Move back to queue
            self.db.collection(self.tasks_collection).document(task_id).set(task.to_dict())
            processing_ref.delete()
            
            logger.info(f"Retrying task {task_id} (attempt {task.retry_count}/{task.max_retries})")
        else:
            # Mark as permanently failed
            task.status = TaskStatus.FAILED
            
            # Move to failed collection
            self.db.collection(self.failed_collection).document(task_id).set(task.to_dict())
            processing_ref.delete()
            self.db.collection(self.tasks_collection).document(task_id).delete()
            
            logger.error(f"Task {task_id} failed permanently: {error_message}")

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of a task"""
        
        # Check all collections for the task
        collections = [
            self.tasks_collection,
            self.processing_collection,
            self.completed_collection,
            self.failed_collection
        ]
        
        for collection_name in collections:
            doc = self.db.collection(collection_name).document(task_id).get()
            if doc.exists:
                return doc.to_dict()
        
        return None

    def get_user_tasks(
        self,
        user_id: str,
        status: Optional[TaskStatus] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get tasks for a specific user"""
        
        collections = [
            self.tasks_collection,
            self.processing_collection,
            self.completed_collection,
            self.failed_collection
        ]
        
        all_tasks = []
        
        for collection_name in collections:
            query = self.db.collection(collection_name)\
                .where('user_id', '==', user_id)\
                .order_by('created_at', direction=firestore.Query.DESCENDING)\
                .limit(limit)
            
            if status:
                query = query.where('status', '==', status.value)
            
            docs = query.stream()
            for doc in docs:
                task_data = doc.to_dict()
                task_data['collection'] = collection_name
                all_tasks.append(task_data)
        
        # Sort by created_at descending
        all_tasks.sort(key=lambda x: x['created_at'], reverse=True)
        return all_tasks[:limit]

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending task"""
        
        task_ref = self.db.collection(self.tasks_collection).document(task_id)
        task_doc = task_ref.get()
        
        if task_doc.exists:
            task_data = task_doc.to_dict()
            if task_data['status'] == TaskStatus.PENDING.value:
                task_ref.update({
                    'status': TaskStatus.CANCELLED.value,
                    'updated_at': datetime.now().isoformat()
                })
                logger.info(f"Cancelled task {task_id}")
                return True
        
        return False

    def cleanup_old_tasks(self, days_old: int = 30):
        """Clean up old completed and failed tasks"""
        
        cutoff_date = datetime.now() - timedelta(days=days_old)
        collections = [self.completed_collection, self.failed_collection]
        
        for collection_name in collections:
            query = self.db.collection(collection_name)\
                .where('completed_at', '<', cutoff_date.isoformat())\
                .limit(100)
            
            docs = query.stream()
            batch = self.db.batch()
            count = 0
            
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
            
            if count > 0:
                batch.commit()
                logger.info(f"Cleaned up {count} old tasks from {collection_name}")

    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        
        stats = {
            'pending': 0,
            'in_progress': 0,
            'completed_today': 0,
            'failed_today': 0,
            'by_type': {},
            'by_priority': {}
        }
        
        # Count pending tasks
        pending_docs = self.db.collection(self.tasks_collection)\
            .where('status', '==', TaskStatus.PENDING.value).stream()
        
        for doc in pending_docs:
            stats['pending'] += 1
            task_data = doc.to_dict()
            task_type = task_data.get('type', 'unknown')
            priority = task_data.get('priority', 'unknown')
            
            stats['by_type'][task_type] = stats['by_type'].get(task_type, 0) + 1
            stats['by_priority'][str(priority)] = stats['by_priority'].get(str(priority), 0) + 1
        
        # Count in-progress tasks
        processing_docs = self.db.collection(self.processing_collection).stream()
        stats['in_progress'] = len(list(processing_docs))
        
        # Count today's completed/failed tasks
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        completed_today = self.db.collection(self.completed_collection)\
            .where('completed_at', '>=', today_start.isoformat()).stream()
        stats['completed_today'] = len(list(completed_today))
        
        failed_today = self.db.collection(self.failed_collection)\
            .where('updated_at', '>=', today_start.isoformat()).stream()
        stats['failed_today'] = len(list(failed_today))
        
        return stats