"""
Task Processors for different types of tasks in TaxFront
Each processor handles a specific type of task from the queue
"""

import json
import tempfile
import os
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import logging

from firebase_admin import storage, firestore
from .task_manager import Task, TaskType, TaskQueue

logger = logging.getLogger(__name__)

class BaseTaskProcessor:
    """Base class for all task processors"""
    
    def __init__(self, db: firestore.Client, task_queue: TaskQueue):
        self.db = db
        self.task_queue = task_queue
        self.bucket = storage.bucket()
    
    def process(self, task: Task) -> Dict[str, Any]:
        """Process a task - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement process method")
    
    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        """Validate task payload - to be implemented by subclasses"""
        return True

class DocumentProcessingProcessor(BaseTaskProcessor):
    """Processor for document processing tasks"""
    
    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        required_fields = ['document_id', 'document_url', 'document_type']
        return all(field in payload for field in required_fields)
    
    def process(self, task: Task) -> Dict[str, Any]:
        """Process a document processing task"""
        
        if not self.validate_payload(task.payload):
            raise ValueError("Invalid payload for document processing task")
        
        document_id = task.payload['document_id']
        document_url = task.payload['document_url']
        document_type = task.payload['document_type']
        document_name = task.payload.get('document_name', 'unknown')
        
        logger.info(f"Processing document {document_id} of type {document_type}")
        
        try:
            # Download document from storage
            blob_path = self._get_blob_path(document_url)
            blob = self.bucket.blob(blob_path)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(document_name)[1]) as temp_file:
                blob.download_to_filename(temp_file.name)
                
                # Process based on document type
                metadata = {}
                extracted_text = ""
                
                if document_type == 'application/pdf':
                    metadata, extracted_text = self._process_pdf(temp_file.name)
                elif document_type.startswith('image/'):
                    metadata, extracted_text = self._process_image(temp_file.name)
                else:
                    logger.warning(f"Unsupported document type: {document_type}")
                
                # Clean up temp file
                os.unlink(temp_file.name)
            
            # Update document in Firestore
            doc_ref = self.db.collection('taxDocuments').document(document_id)
            update_data = {
                'status': 'processed',
                'metadata': metadata,
                'extractedText': extracted_text,
                'processedAt': datetime.now().isoformat(),
                'processingDetails': {
                    'success': True,
                    'timestamp': datetime.now().isoformat(),
                    'processor': 'DocumentProcessingProcessor'
                }
            }
            doc_ref.update(update_data)
            
            # Update user document count
            user_ref = self.db.collection('users').document(task.user_id)
            user_ref.set({
                'documentCount': firestore.Increment(1),
                'lastProcessedAt': datetime.now().isoformat()
            }, merge=True)
            
            return {
                'document_id': document_id,
                'metadata': metadata,
                'text_length': len(extracted_text),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            
            # Update document with error status
            doc_ref = self.db.collection('taxDocuments').document(document_id)
            doc_ref.update({
                'status': 'error',
                'error': str(e),
                'processedAt': datetime.now().isoformat()
            })
            
            raise e
    
    def _get_blob_path(self, url: str) -> str:
        """Extract blob path from storage URL"""
        if url.startswith('gs://'):
            return url.split('/', 3)[3]  # Skip gs://bucket/
        else:
            parsed_url = urlparse(url)
            path = parsed_url.path.lstrip('/')
            return '/'.join(path.split('/')[1:])  # Skip bucket name
    
    def _process_pdf(self, file_path: str) -> tuple[Dict[str, Any], str]:
        """Process PDF document"""
        try:
            import PyPDF2
            
            metadata = {}
            extracted_text = ""
            
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract metadata
                if pdf_reader.metadata:
                    metadata.update({
                        'title': pdf_reader.metadata.get('/Title', ''),
                        'author': pdf_reader.metadata.get('/Author', ''),
                        'creator': pdf_reader.metadata.get('/Creator', ''),
                        'producer': pdf_reader.metadata.get('/Producer', ''),
                        'creation_date': str(pdf_reader.metadata.get('/CreationDate', '')),
                    })
                
                metadata['page_count'] = len(pdf_reader.pages)
                
                # Extract text from all pages
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        extracted_text += f"\n--- Page {page_num + 1} ---\n{page_text}"
                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num + 1}: {e}")
            
            return metadata, extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            return {}, ""
    
    def _process_image(self, file_path: str) -> tuple[Dict[str, Any], str]:
        """Process image document using OCR"""
        try:
            import pytesseract
            from PIL import Image
            
            # Open image
            image = Image.open(file_path)
            
            # Extract metadata
            metadata = {
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'width': image.width,
                'height': image.height
            }
            
            # Perform OCR
            extracted_text = pytesseract.image_to_string(image)
            
            return metadata, extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {}, ""

class FormGenerationProcessor(BaseTaskProcessor):
    """Processor for tax form generation tasks"""
    
    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        required_fields = ['form_type', 'form_data', 'tax_year']
        return all(field in payload for field in required_fields)
    
    def process(self, task: Task) -> Dict[str, Any]:
        """Process a form generation task"""
        
        if not self.validate_payload(task.payload):
            raise ValueError("Invalid payload for form generation task")
        
        form_type = task.payload['form_type']
        form_data = task.payload['form_data']
        tax_year = task.payload['tax_year']
        
        logger.info(f"Generating form {form_type} for tax year {tax_year}")
        
        try:
            # Generate form based on type
            if form_type == 'FORM_1040':
                result = self._generate_form_1040(form_data, tax_year)
            elif form_type == 'SCHEDULE_C':
                result = self._generate_schedule_c(form_data, tax_year)
            else:
                raise ValueError(f"Unsupported form type: {form_type}")
            
            # Store generated form
            form_id = self._store_generated_form(result, task.user_id, form_type, tax_year)
            
            return {
                'form_id': form_id,
                'form_type': form_type,
                'tax_year': tax_year,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error generating form {form_type}: {str(e)}")
            raise e
    
    def _generate_form_1040(self, form_data: Dict[str, Any], tax_year: int) -> Dict[str, Any]:
        """Generate Form 1040"""
        # Implement Form 1040 generation logic
        return {
            'form_type': 'FORM_1040',
            'tax_year': tax_year,
            'data': form_data,
            'calculations': self._calculate_form_1040(form_data)
        }
    
    def _generate_schedule_c(self, form_data: Dict[str, Any], tax_year: int) -> Dict[str, Any]:
        """Generate Schedule C"""
        # Implement Schedule C generation logic
        return {
            'form_type': 'SCHEDULE_C',
            'tax_year': tax_year,
            'data': form_data,
            'calculations': self._calculate_schedule_c(form_data)
        }
    
    def _calculate_form_1040(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform Form 1040 calculations"""
        # Implement tax calculations
        return {'total_tax': 0, 'refund_due': 0}
    
    def _calculate_schedule_c(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform Schedule C calculations"""
        # Implement business income calculations
        return {'net_profit': 0, 'total_expenses': 0}
    
    def _store_generated_form(self, form_result: Dict[str, Any], user_id: str, form_type: str, tax_year: int) -> str:
        """Store generated form in Firestore"""
        form_ref = self.db.collection('generatedForms').document()
        form_data = {
            'userId': user_id,
            'formType': form_type,
            'taxYear': tax_year,
            'formData': form_result,
            'createdAt': datetime.now().isoformat(),
            'status': 'generated'
        }
        form_ref.set(form_data)
        return form_ref.id

class AIAnalysisProcessor(BaseTaskProcessor):
    """Processor for AI analysis tasks"""
    
    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        required_fields = ['analysis_type', 'input_data']
        return all(field in payload for field in required_fields)
    
    def process(self, task: Task) -> Dict[str, Any]:
        """Process an AI analysis task"""
        
        if not self.validate_payload(task.payload):
            raise ValueError("Invalid payload for AI analysis task")
        
        analysis_type = task.payload['analysis_type']
        input_data = task.payload['input_data']
        
        logger.info(f"Performing AI analysis: {analysis_type}")
        
        try:
            if analysis_type == 'document_classification':
                result = self._classify_document(input_data)
            elif analysis_type == 'tax_optimization':
                result = self._analyze_tax_optimization(input_data)
            elif analysis_type == 'deduction_finder':
                result = self._find_deductions(input_data)
            else:
                raise ValueError(f"Unsupported analysis type: {analysis_type}")
            
            # Store analysis result
            analysis_id = self._store_analysis_result(result, task.user_id, analysis_type)
            
            return {
                'analysis_id': analysis_id,
                'analysis_type': analysis_type,
                'result': result,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in AI analysis {analysis_type}: {str(e)}")
            raise e
    
    def _classify_document(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Classify document using AI"""
        # Implement document classification logic
        return {
            'document_type': 'W-2',
            'confidence': 0.95,
            'extracted_fields': {}
        }
    
    def _analyze_tax_optimization(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze tax optimization opportunities"""
        # Implement tax optimization analysis
        return {
            'recommendations': [],
            'potential_savings': 0,
            'strategies': []
        }
    
    def _find_deductions(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Find potential tax deductions"""
        # Implement deduction finding logic
        return {
            'deductions': [],
            'total_amount': 0,
            'categories': {}
        }
    
    def _store_analysis_result(self, result: Dict[str, Any], user_id: str, analysis_type: str) -> str:
        """Store analysis result in Firestore"""
        analysis_ref = self.db.collection('aiAnalysis').document()
        analysis_data = {
            'userId': user_id,
            'analysisType': analysis_type,
            'result': result,
            'createdAt': datetime.now().isoformat()
        }
        analysis_ref.set(analysis_data)
        return analysis_ref.id

class NotificationProcessor(BaseTaskProcessor):
    """Processor for notification tasks"""
    
    def validate_payload(self, payload: Dict[str, Any]) -> bool:
        required_fields = ['notification_type', 'recipient', 'message']
        return all(field in payload for field in required_fields)
    
    def process(self, task: Task) -> Dict[str, Any]:
        """Process a notification task"""
        
        if not self.validate_payload(task.payload):
            raise ValueError("Invalid payload for notification task")
        
        notification_type = task.payload['notification_type']
        recipient = task.payload['recipient']
        message = task.payload['message']
        
        logger.info(f"Sending {notification_type} notification to {recipient}")
        
        try:
            if notification_type == 'email':
                result = self._send_email(recipient, message)
            elif notification_type == 'push':
                result = self._send_push_notification(recipient, message)
            elif notification_type == 'in_app':
                result = self._create_in_app_notification(recipient, message)
            else:
                raise ValueError(f"Unsupported notification type: {notification_type}")
            
            return {
                'notification_type': notification_type,
                'recipient': recipient,
                'success': True,
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Error sending {notification_type} notification: {str(e)}")
            raise e
    
    def _send_email(self, recipient: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Send email notification"""
        # Implement email sending logic
        logger.info(f"Email sent to {recipient}")
        return {'message_id': 'email_123', 'status': 'sent'}
    
    def _send_push_notification(self, recipient: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Send push notification"""
        # Implement push notification logic
        logger.info(f"Push notification sent to {recipient}")
        return {'message_id': 'push_123', 'status': 'sent'}
    
    def _create_in_app_notification(self, recipient: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Create in-app notification"""
        # Store notification in Firestore
        notification_ref = self.db.collection('notifications').document()
        notification_data = {
            'userId': recipient,
            'message': message,
            'createdAt': datetime.now().isoformat(),
            'read': False,
            'type': 'in_app'
        }
        notification_ref.set(notification_data)
        
        logger.info(f"In-app notification created for {recipient}")
        return {'notification_id': notification_ref.id, 'status': 'created'}