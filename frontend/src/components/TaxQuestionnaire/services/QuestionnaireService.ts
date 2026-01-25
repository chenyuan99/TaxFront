import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { QuestionnaireData, ValidationRule, ValidationErrors } from '../types';

export interface QuestionnaireService {
  saveQuestionnaire(userId: string, data: Partial<QuestionnaireData>): Promise<void>;
  loadQuestionnaire(userId: string): Promise<QuestionnaireData | null>;
  submitQuestionnaire(userId: string, data: QuestionnaireData): Promise<string>;
  validateField(field: string, value: any, rules: ValidationRule[]): ValidationErrors;
}

class FirebaseQuestionnaireService implements QuestionnaireService {
  private readonly COLLECTION_NAME = 'taxQuestionnaires';

  async saveQuestionnaire(userId: string, data: Partial<QuestionnaireData>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      const updateData = {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString(),
        }
      };

      await setDoc(docRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      throw new Error('Failed to save questionnaire data');
    }
  }

  async loadQuestionnaire(userId: string): Promise<QuestionnaireData | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as QuestionnaireData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      throw new Error('Failed to load questionnaire data');
    }
  }

  async submitQuestionnaire(userId: string, data: QuestionnaireData): Promise<string> {
    try {
      const referenceNumber = `TQ-${Date.now()}-${userId.slice(-6)}`;
      
      const submissionData = {
        ...data,
        metadata: {
          ...data.metadata,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          referenceNumber,
          status: 'submitted'
        }
      };

      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await setDoc(docRef, submissionData);
      
      // Also save to submissions collection for processing
      const submissionRef = doc(db, 'questionnaireSubmissions', referenceNumber);
      await setDoc(submissionRef, {
        userId,
        submittedAt: serverTimestamp(),
        referenceNumber,
        status: 'pending_review'
      });

      return referenceNumber;
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      throw new Error('Failed to submit questionnaire');
    }
  }

  validateField(field: string, value: any, rules: ValidationRule[]): ValidationErrors {
    const errors: ValidationErrors = {};
    
    for (const rule of rules) {
      if (rule.field !== field) continue;
      
      let isValid = true;
      
      switch (rule.type) {
        case 'required':
          isValid = value !== undefined && value !== null && value !== '';
          break;
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = !value || emailRegex.test(value);
          break;
          
        case 'phone':
          // U.S. phone number validation (10 digits) or special case 0000000000
          const phoneRegex = /^\d{10}$/;
          isValid = !value || phoneRegex.test(value.replace(/\D/g, ''));
          break;
          
        case 'date':
          isValid = !value || !isNaN(Date.parse(value));
          break;
          
        case 'custom':
          isValid = !rule.validator || rule.validator(value);
          break;
      }
      
      if (!isValid) {
        errors[field] = rule.message;
        break; // Stop at first error
      }
    }
    
    return errors;
  }
}

export const questionnaireService = new FirebaseQuestionnaireService();