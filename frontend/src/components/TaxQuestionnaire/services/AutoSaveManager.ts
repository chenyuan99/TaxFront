import { QuestionnaireData } from '../types';
import { questionnaireService } from './QuestionnaireService';

export interface AutoSaveManager {
  enableAutoSave(userId: string, callback: (data: Partial<QuestionnaireData>) => void): void;
  disableAutoSave(): void;
  saveNow(data: Partial<QuestionnaireData>): Promise<void>;
  getLastSaved(): Date | null;
}

class AutoSaveManagerImpl implements AutoSaveManager {
  private userId: string | null = null;
  private saveCallback: ((data: Partial<QuestionnaireData>) => void) | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastSaved: Date | null = null;
  private pendingData: Partial<QuestionnaireData> | null = null;
  
  private readonly SAVE_DELAY = 2000; // 2 seconds delay after last change
  private readonly MAX_SAVE_INTERVAL = 30000; // Force save every 30 seconds

  enableAutoSave(userId: string, callback: (data: Partial<QuestionnaireData>) => void): void {
    this.userId = userId;
    this.saveCallback = callback;
    
    // Set up periodic forced saves
    setInterval(() => {
      if (this.pendingData && this.userId) {
        this.performSave();
      }
    }, this.MAX_SAVE_INTERVAL);
  }

  disableAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Perform final save if there's pending data
    if (this.pendingData && this.userId) {
      this.performSave();
    }
    
    this.userId = null;
    this.saveCallback = null;
    this.pendingData = null;
  }

  async saveNow(data: Partial<QuestionnaireData>): Promise<void> {
    if (!this.userId) {
      throw new Error('AutoSave not enabled - no userId set');
    }
    
    this.pendingData = { ...this.pendingData, ...data };
    
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Set new timeout for delayed save
    this.saveTimeout = setTimeout(() => {
      this.performSave();
    }, this.SAVE_DELAY);
  }

  getLastSaved(): Date | null {
    return this.lastSaved;
  }

  private async performSave(): Promise<void> {
    if (!this.userId || !this.pendingData) {
      return;
    }

    try {
      await questionnaireService.saveQuestionnaire(this.userId, this.pendingData);
      this.lastSaved = new Date();
      
      // Notify callback of successful save
      if (this.saveCallback) {
        this.saveCallback(this.pendingData);
      }
      
      // Clear pending data after successful save
      this.pendingData = null;
      
      console.log('Auto-save completed at:', this.lastSaved.toISOString());
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Keep pending data for retry
      // Could implement exponential backoff here
    }
    
    // Clear timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}

export const autoSaveManager = new AutoSaveManagerImpl();