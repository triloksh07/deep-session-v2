import React from 'react';
import { useSession } from './contexts/SessionContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Code, Book, Target, Dumbbell, MoreHorizontal } from 'lucide-react';

const iconMap = {
  'code': Code,
  'book': Book,
  'target': Target,
  'dumbbell': Dumbbell,
  'more-horizontal': MoreHorizontal,
};

export function SessionTypes() {
  const { sessionTypes } = useSession();

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || MoreHorizontal;
    return IconComponent;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Session Types</h3>
        
        <div className="space-y-3">
          {sessionTypes.map((type) => {
            const IconComponent = getIcon(type.icon);
            
            return (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <IconComponent 
                      className="w-4 h-4" 
                      style={{ color: type.color }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {type.name}
                  </span>
                </div>
                
                {type.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {sessionTypes.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No session types found
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}