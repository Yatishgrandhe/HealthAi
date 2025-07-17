import { supabase } from './supabaseClient';

export interface HealthData {
  id?: string;
  user_id?: string;
  data_type: 'therapist_chat' | 'posture_check' | 'fitness_planner' | 'saved_routines' | 'browser_data';
  data_key: string;
  data_value: any;
  image_urls?: string[];
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface TherapistChatSession {
  id?: string;
  user_id?: string;
  session_title?: string;
  messages: any[];
  ai_model_used?: string;
  session_duration?: number;
  mood_score?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PostureCheckSession {
  id?: string;
  user_id?: string;
  session_title?: string;
  posture_score: number;
  analysis_data: any;
  image_urls?: string[];
  recommendations?: any;
  duration_seconds?: number;
  created_at?: string;
}

export interface FitnessPlan {
  id?: string;
  user_id?: string;
  plan_name: string;
  plan_type: 'strength' | 'cardio' | 'flexibility' | 'weight_loss' | 'muscle_gain' | 'general';
  duration_days?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  exercises: any;
  nutrition_plan?: any;
  goals?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyFitnessPlan {
  id?: string;
  user_id?: string;
  fitness_plan_id?: string;
  day_number: number;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  exercises: {
    cardio: string;
    strength: string;
    flexibility: string;
  };
  tips?: string;
  progress_notes?: string;
  completed?: boolean;
  completed_at?: string;
  image_urls?: string[];
  notes?: string;
  created_at?: string;
}

export interface FitnessProgress {
  id?: string;
  user_id?: string;
  fitness_plan_id?: string;
  day_number: number;
  completed_workouts: number;
  completed_meals: number;
  mood_score?: number;
  energy_level?: number;
  notes?: string;
  image_urls?: string[];
  recorded_at?: string;
}

export interface SavedRoutine {
  id?: string;
  user_id?: string;
  routine_name: string;
  routine_type: 'workout' | 'meditation' | 'stretching' | 'custom';
  routine_data: any;
  image_urls?: string[];
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HealthProgress {
  id?: string;
  user_id?: string;
  metric_type: 'mood' | 'posture' | 'fitness' | 'weight' | 'sleep' | 'stress';
  metric_value: number;
  metric_unit?: string;
  notes?: string;
  image_urls?: string[];
  recorded_at?: string;
}

export interface ImageMetadata {
  id?: string;
  user_id?: string;
  image_url: string;
  image_type: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile';
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags?: string[];
  created_at?: string;
}

class HealthDataService {
  // Check if supabase is available
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
  }

  // Get current user
  private async getCurrentUser() {
    this.checkSupabase();
    const { data: { user }, error } = await supabase!.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // Create or update user profile
  async createUserProfile(profileData: Partial<{ email: string; full_name: string; phone_number: string; date_of_birth: string; emergency_contact: string; account_type: string }>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Generic health data operations
  async saveHealthData(data: HealthData) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data: savedData, error } = await supabase!
      .from('user_health_data')
      .upsert({
        user_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return savedData;
  }

  async getHealthData(dataType: string, dataKey?: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    let query = supabase!
      .from('user_health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', dataType);

    if (dataKey) {
      query = query.eq('data_key', dataKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Browser data migration
  async migrateBrowserData(browserData: any) {
    const user = await this.getCurrentUser();
    
    // Start migration tracking
    const { data: migration, error: migrationError } = await supabase
      .from('browser_data_migrations')
      .insert({
        user_id: user.id,
        migration_type: 'browser_to_account',
        migration_status: 'in_progress'
      })
      .select()
      .single();

    if (migrationError) throw migrationError;

    try {
      const migratedData = [];
      
      // Migrate therapist chat data
      if (browserData.therapistChat) {
        for (const session of browserData.therapistChat) {
          const savedSession = await this.saveTherapistChatSession({
            session_title: session.title || 'Migrated Session',
            messages: session.messages || [],
            ai_model_used: session.model || 'default',
            session_duration: session.duration || 0,
            mood_score: session.moodScore || null,
            tags: session.tags || []
          });
          migratedData.push(savedSession);
        }
      }

      // Migrate posture check data
      if (browserData.postureCheck) {
        for (const session of browserData.postureCheck) {
          const savedSession = await this.savePostureCheckSession({
            session_title: session.title || 'Migrated Posture Check',
            posture_score: session.score || 0,
            analysis_data: session.analysis || {},
            image_urls: session.imageUrls || [],
            recommendations: session.recommendations || {},
            duration_seconds: session.duration || 0
          });
          migratedData.push(savedSession);
        }
      }

      // Migrate fitness planner data
      if (browserData.fitnessPlanner) {
        for (const plan of browserData.fitnessPlanner) {
          const savedPlan = await this.saveFitnessPlan({
            plan_name: plan.name || 'Migrated Plan',
            plan_type: plan.type || 'general',
            duration_days: plan.duration || 90,
            difficulty_level: plan.difficulty || 'beginner',
            exercises: plan.exercises || {},
            nutrition_plan: plan.nutrition || {},
            goals: plan.goals || {},
            is_active: plan.isActive !== false
          });
          migratedData.push(savedPlan);
        }
      }

      // Migrate saved routines
      if (browserData.savedRoutines) {
        for (const routine of browserData.savedRoutines) {
          const savedRoutine = await this.saveSavedRoutine({
            routine_name: routine.name || 'Migrated Routine',
            routine_type: routine.type || 'custom',
            routine_data: routine.data || {},
            image_urls: routine.imageUrls || [],
            is_favorite: routine.isFavorite || false
          });
          migratedData.push(savedRoutine);
        }
      }

      // Update migration status
      await supabase
        .from('browser_data_migrations')
        .update({
          migration_status: 'completed',
          data_count: migratedData.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', migration.id);

      return {
        success: true,
        migratedCount: migratedData.length,
        data: migratedData
      };

    } catch (error) {
      // Update migration status to failed
      await supabase
        .from('browser_data_migrations')
        .update({
          migration_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', migration.id);

      throw error;
    }
  }

  // Check if user has browser data to migrate
  async checkBrowserDataMigration() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('browser_data_migrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('migration_type', 'browser_to_account')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  }

  // Therapist chat operations
  async saveTherapistChatSession(session: Omit<TherapistChatSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('therapist_chat_sessions')
      .insert({
        user_id: user.id,
        ...session
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTherapistChatSessions() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('therapist_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Posture check operations
  async savePostureCheckSession(session: Omit<PostureCheckSession, 'id' | 'user_id' | 'created_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .insert({
        user_id: user.id,
        ...session
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPostureCheckSessions() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Enhanced fitness plan operations
  async saveFitnessPlan(plan: Omit<FitnessPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .insert({
        user_id: user.id,
        ...plan
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFitnessPlans() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getActiveFitnessPlan() {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  async updateFitnessPlan(planId: string, updates: Partial<FitnessPlan>) {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .update(updates)
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Daily fitness plan operations
  async saveDailyFitnessPlan(dailyPlan: Omit<DailyFitnessPlan, 'id' | 'user_id' | 'created_at'>) {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('daily_fitness_plans')
      .upsert({
        user_id: user.id,
        ...dailyPlan
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDailyFitnessPlans(fitnessPlanId?: string) {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    let query = supabase
      .from('daily_fitness_plans')
      .select('*')
      .eq('user_id', user.id);

    if (fitnessPlanId) {
      query = query.eq('fitness_plan_id', fitnessPlanId);
    }

    const { data, error } = await query.order('day_number', { ascending: true });
    if (error) throw error;
    return data;
  }

  async getDailyFitnessPlan(dayNumber: number, fitnessPlanId?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('daily_fitness_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_number', dayNumber);

    if (fitnessPlanId) {
      query = query.eq('fitness_plan_id', fitnessPlanId);
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateDailyFitnessPlan(dayNumber: number, updates: Partial<DailyFitnessPlan>, fitnessPlanId?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('daily_fitness_plans')
      .update(updates)
      .eq('user_id', user.id)
      .eq('day_number', dayNumber);

    if (fitnessPlanId) {
      query = query.eq('fitness_plan_id', fitnessPlanId);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  // Fitness progress tracking
  async saveFitnessProgress(progress: Omit<FitnessProgress, 'id' | 'user_id' | 'recorded_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('fitness_progress')
      .upsert({
        user_id: user.id,
        ...progress
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFitnessProgress(fitnessPlanId?: string) {
    const user = await this.getCurrentUser();
    
    if (!supabase) throw new Error('Supabase client not initialized');
    
    let query = supabase
      .from('fitness_progress')
      .select('*')
      .eq('user_id', user.id);

    if (fitnessPlanId) {
      query = query.eq('fitness_plan_id', fitnessPlanId);
    }

    const { data, error } = await query.order('day_number', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Fitness plan with image storage
  async saveFitnessPlanWithImages(plan: Omit<FitnessPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>, imageData?: string) {
    const user = await this.getCurrentUser();
    let imageUrls: string[] = [];

    // Upload image if provided
    if (imageData) {
      try {
        const imageUrl = await this.uploadImageToStorage(imageData, 'fitness', user.id);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error('Failed to upload fitness plan image:', error);
      }
    }

    // Save fitness plan
    const { data: fitnessPlan, error: planError } = await supabase
      .from('fitness_plans')
      .insert({
        user_id: user.id,
        ...plan
      })
      .select()
      .single();

    if (planError) throw planError;

    // Save image metadata if images were uploaded
    if (imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        await this.saveImageMetadata({
          image_url: imageUrl,
          image_type: 'fitness',
          file_name: `fitness_plan_${fitnessPlan.id}`,
          tags: ['fitness_plan', plan.plan_type]
        });
      }
    }

    return fitnessPlan;
  }

  // Saved routines operations
  async saveSavedRoutine(routine: Omit<SavedRoutine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('saved_routines')
      .insert({
        user_id: user.id,
        ...routine
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSavedRoutines() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('saved_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateSavedRoutine(routineId: string, updates: Partial<SavedRoutine>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('saved_routines')
      .update(updates)
      .eq('id', routineId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSavedRoutine(routineId: string) {
    const user = await this.getCurrentUser();
    
    const { error } = await supabase
      .from('saved_routines')
      .delete()
      .eq('id', routineId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  }

  // Health progress operations
  async saveHealthProgress(progress: Omit<HealthProgress, 'id' | 'user_id' | 'recorded_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('health_progress')
      .insert({
        user_id: user.id,
        ...progress
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHealthProgress(metricType?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('health_progress')
      .select('*')
      .eq('user_id', user.id);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Image metadata operations
  async saveImageMetadata(metadata: Omit<ImageMetadata, 'id' | 'user_id' | 'created_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('image_metadata')
      .insert({
        user_id: user.id,
        ...metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getImageMetadata(imageType?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('image_metadata')
      .select('*')
      .eq('user_id', user.id);

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Cross-account data sharing
  async shareDataWithUser(sharedWithEmail: string, dataType: string, permissionLevel: 'read' | 'write' | 'admin' = 'read') {
    const user = await this.getCurrentUser();
    
    // Get the user to share with
    const { data: sharedWithUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', sharedWithEmail)
      .single();

    if (userError || !sharedWithUser) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('data_sharing_permissions')
      .upsert({
        user_id: user.id,
        shared_with_user_id: sharedWithUser.id,
        data_type: dataType,
        permission_level: permissionLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSharedData() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('data_sharing_permissions')
      .select(`
        *,
        user_profiles!data_sharing_permissions_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('shared_with_user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  // Analytics operations
  async saveHealthAnalytics(analyticsType: string, analyticsData: any, insights?: any, recommendations?: any) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('health_analytics')
      .insert({
        user_id: user.id,
        analytics_type: analyticsType,
        analytics_data: analyticsData,
        insights,
        recommendations
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHealthAnalytics(analyticsType?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('health_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (analyticsType) {
      query = query.eq('analytics_type', analyticsType);
    }

    const { data, error } = await query.order('generated_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Enhanced dashboard summary with fitness data
  async getDashboardSummary() {
    const user = await this.getCurrentUser();
    
    try {
      // Get counts for different health activities
      const [
        therapistSessions,
        postureChecks,
        fitnessPlans,
        savedRoutines,
        healthProgress
      ] = await Promise.all([
        this.getTherapistChatSessions(),
        this.getPostureCheckSessions(),
        this.getFitnessPlans(),
        this.getSavedRoutines(),
        this.getHealthProgress()
      ]);

      // Calculate health score based on various metrics
      const healthScore = this.calculateHealthScore({
        therapistSessions: therapistSessions.length,
        postureChecks: postureChecks.length,
        fitnessPlans: fitnessPlans.length,
        savedRoutines: savedRoutines.length,
        healthProgress: healthProgress.length
      });

      // Get recent activities
      const recentActivities = await this.getRecentActivities();

      return {
        totalTherapySessions: therapistSessions.length,
        totalPostureChecks: postureChecks.length,
        totalFitnessPlans: fitnessPlans.length,
        totalSavedRoutines: savedRoutines.length,
        healthScore,
        recentActivities,
        averagePostureScore: this.calculateAveragePostureScore(postureChecks),
        progressStreak: this.calculateProgressStreak(healthProgress),
        fitnessProgress: this.calculateFitnessProgress(fitnessPlans)
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        totalTherapySessions: 0,
        totalPostureChecks: 0,
        totalFitnessPlans: 0,
        totalSavedRoutines: 0,
        healthScore: 0,
        recentActivities: [],
        averagePostureScore: 0,
        progressStreak: 0,
        fitnessProgress: 0
      };
    }
  }

  private calculateHealthScore(metrics: any): number {
    const weights = {
      therapistSessions: 0.2,
      postureChecks: 0.25,
      fitnessPlans: 0.25,
      savedRoutines: 0.15,
      healthProgress: 0.15
    };

    const maxValues = {
      therapistSessions: 10,
      postureChecks: 20,
      fitnessPlans: 5,
      savedRoutines: 15,
      healthProgress: 30
    };

    let score = 0;
    for (const [metric, value] of Object.entries(metrics)) {
      const weight = weights[metric as keyof typeof weights];
      const maxValue = maxValues[metric as keyof typeof maxValues];
      score += (Math.min(value, maxValue) / maxValue) * weight * 100;
    }

    return Math.round(score);
  }

  private calculateAveragePostureScore(postureChecks: any[]): number {
    if (postureChecks.length === 0) return 0;
    const totalScore = postureChecks.reduce((sum, check) => sum + (check.posture_score || 0), 0);
    return Math.round(totalScore / postureChecks.length);
  }

  private calculateProgressStreak(healthProgress: any[]): number {
    if (healthProgress.length === 0) return 0;
    
    // Sort by recorded_at and calculate consecutive days
    const sortedProgress = healthProgress
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const progress of sortedProgress) {
      const progressDate = new Date(progress.recorded_at);
      const daysDiff = Math.floor((currentDate.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        streak++;
        currentDate = progressDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateFitnessProgress(fitnessPlans: any[]): number {
    if (fitnessPlans.length === 0) return 0;
    
    const activePlans = fitnessPlans.filter(plan => plan.is_active);
    if (activePlans.length === 0) return 0;
    
    // Calculate average completion rate (simplified)
    return Math.round((activePlans.length / fitnessPlans.length) * 100);
  }

  private async getRecentActivities() {
    const user = await this.getCurrentUser();
    const activities = [];

    try {
      // Get recent therapist sessions
      const { data: recentSessions } = await supabase
        .from('therapist_chat_sessions')
        .select('session_title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentSessions) {
        activities.push(...recentSessions.map(session => ({
          type: 'therapy',
          title: session.session_title || 'Therapy Session',
          date: session.created_at,
          icon: 'Psychology'
        })));
      }

      // Get recent posture checks
      const { data: recentPosture } = await supabase
        .from('posture_check_sessions')
        .select('session_title, created_at, posture_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentPosture) {
        activities.push(...recentPosture.map(check => ({
          type: 'posture',
          title: check.session_title || 'Posture Check',
          date: check.created_at,
          score: check.posture_score,
          icon: 'Accessibility'
        })));
      }

      // Get recent fitness activities
      const { data: recentFitness } = await supabase
        .from('fitness_plans')
        .select('plan_name, created_at, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentFitness) {
        activities.push(...recentFitness.map(plan => ({
          type: 'fitness',
          title: plan.plan_name,
          date: plan.created_at,
          status: plan.is_active ? 'Active' : 'Completed',
          icon: 'FitnessCenter'
        })));
      }

      // Sort all activities by date and return top 5
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  // Browser storage utilities
  static getBrowserData() {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = {
        therapistChat: JSON.parse(localStorage.getItem('healthAI_therapistChat') || '[]'),
        postureCheck: JSON.parse(localStorage.getItem('healthAI_postureCheck') || '[]'),
        fitnessPlanner: JSON.parse(localStorage.getItem('healthAI_fitnessPlanner') || '[]'),
        savedRoutines: JSON.parse(localStorage.getItem('healthAI_savedRoutines') || '[]'),
        healthProgress: JSON.parse(localStorage.getItem('healthAI_healthProgress') || '[]')
      };
      
      return data;
    } catch (error) {
      console.error('Error reading browser data:', error);
      return null;
    }
  }

  static saveBrowserData(key: string, data: any) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`healthAI_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving browser data:', error);
    }
  }

  static clearBrowserData() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('healthAI_therapistChat');
      localStorage.removeItem('healthAI_postureCheck');
      localStorage.removeItem('healthAI_fitnessPlanner');
      localStorage.removeItem('healthAI_savedRoutines');
      localStorage.removeItem('healthAI_healthProgress');
    } catch (error) {
      console.error('Error clearing browser data:', error);
    }
  }
}

// Export static methods for browser data operations
export const getBrowserData = HealthDataService.getBrowserData;
export const saveBrowserData = HealthDataService.saveBrowserData;
export const clearBrowserData = HealthDataService.clearBrowserData;

export default HealthDataService; 