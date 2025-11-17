'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  CheckCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Session, Goal } from '@/types';

interface GoalsProps {
  sessions: Session[];
  onGoalCreate: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void;
  onGoalUpdate: (id: string, goal: Partial<Goal>) => void;
  onGoalDelete: (id: string) => void;
  goals: Goal[];
}

type CreateGoalInput = Omit<Goal, 'id' | 'createdAt'> & { userId?: string };

export default function Goals({ sessions, onGoalCreate, onGoalUpdate, onGoalDelete, goals }: GoalsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    targetValue: 2,
    targetUnit: 'hours' as 'hours' | 'sessions' | 'minutes',
    category: 'Coding',
    isActive: true
  });

  const sessionTypes = ['Coding', 'Learning', 'Practice', 'Exercise', 'Planning', 'Other', 'All'];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      targetValue: 2,
      targetUnit: 'hours',
      category: 'Coding',
      isActive: true
    });
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        onGoalUpdate(editingGoal.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        onGoalCreate(formData);
      }

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleEdit = (goal: Goal) => {
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.targetValue,
      targetUnit: goal.targetUnit,
      category: goal.category,
      isActive: goal.isActive
    });
    setEditingGoal(goal);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await onGoalDelete(goalId);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const calculateProgress = (goal: Goal) => {
    const now = new Date();
    let startDate: Date;

    switch (goal.type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const relevantSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const matchesCategory = goal.category === 'All' || session.type === goal.category;
      return sessionDate >= startDate && matchesCategory;
    });

    let currentValue = 0;

    switch (goal.targetUnit) {
      case 'hours':
        currentValue = relevantSessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0) / 3600;
        break;
      case 'minutes':
        currentValue = relevantSessions.reduce((acc, session) => acc + (session.sessionTime / 1000), 0) / 60;
        break;
      case 'sessions':
        currentValue = relevantSessions.length;
        break;
    }

    const percentage = Math.min((currentValue / goal.targetValue) * 100, 100);
    const isCompleted = currentValue >= goal.targetValue;

    return {
      currentValue: Math.round(currentValue * 100) / 100,
      percentage: Math.round(percentage),
      isCompleted,
      sessionsCount: relevantSessions.length,
      remainingValue: Math.max(goal.targetValue - currentValue, 0)
    };
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <Target className="h-4 w-4" />;
      case 'monthly': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeGoals = goals.filter(goal => goal.isActive);
  const completedGoals = activeGoals.filter(goal => calculateProgress(goal).isCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Goals & Targets</h2>
          <p className="text-muted-foreground">Set and track your productivity goals</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Daily coding practice"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Time Period</Label>
                  <Select value={formData.type} onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Amount</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.targetValue}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      targetValue: parseFloat(e.target.value) || 1
                    }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUnit">Unit</Label>
                  <Select value={formData.targetUnit} onValueChange={(value: 'hours' | 'sessions' | 'minutes') =>
                    setFormData(prev => ({ ...prev, targetUnit: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="sessions">Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGoals.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGoals.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedGoals.length > 0 ? 'Great job!' : 'Keep going!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeGoals.length > 0 ? Math.round((completedGoals.length / activeGoals.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals List */}
      {activeGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No Goals Set</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal to start tracking your progress and building productive habits.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(goal);

            return (
              <Card key={goal.id} className={`transition-shadow hover:shadow-md ${progress.isCompleted ? 'ring-2 ring-green-200 bg-green-50/30' : ''
                }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{goal.title}</h3>
                        {progress.isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getGoalTypeColor(goal.type)}>
                        {getGoalIcon(goal.type)}
                        <span className="ml-1 capitalize">{goal.type}</span>
                      </Badge>

                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {progress.currentValue} / {goal.targetValue} {goal.targetUnit}
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {progress.isCompleted ? (
                        <span className="text-green-600 font-medium">✓ Goal completed!</span>
                      ) : (
                        <span>
                          {progress.remainingValue.toFixed(1)} {goal.targetUnit} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Goal Details */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Category: {goal.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{progress.sessionsCount} sessions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}