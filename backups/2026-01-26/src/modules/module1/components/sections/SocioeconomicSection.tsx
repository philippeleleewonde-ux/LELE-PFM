import { SocioeconomicImprovement } from '@/modules/module1/types';
import { Briefcase, Users, MessageSquare, Clock, Award, Target } from 'lucide-react';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';

interface SocioeconomicSectionProps {
  data: SocioeconomicImprovement;
  onChange: (data: SocioeconomicImprovement) => void;
}

export function SocioeconomicSection({ data, onChange }: SocioeconomicSectionProps) {
  const handleChange = (field: keyof SocioeconomicImprovement, value: string) => {
    const numericValue = CFOCalculationEngine.convertQualitativeToQuantitative(value);
    onChange({ ...data, [field]: numericValue });
  };

  const getDisplayValue = (value: string | number) => {
    if (typeof value === 'number') {
      return CFOCalculationEngine.convertQuantitativeToQualitative(value);
    }
    return value || '';
  };

  const importanceOptions = [
    'Not important at all',
    'Not very important',
    'Somewhat important',
    'Important',
    'Very important'
  ];

  const keyAreas = [
    {
      id: 'keyArea1_workingConditions' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 1: the working conditions',
      description: 'Classify in this domain, everything related to the physical environment, the workload, the safety and the technological conditions (the material or the equipment)',
      icon: <Briefcase className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'keyArea2_workOrganization' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 2: the organization of work',
      description: 'Classify in this domain, everything in relation with the organization chart, the conception of job posts, etc',
      icon: <Users className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'keyArea3_communication' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 3 : 3C (Communication, coordination and dialogue)',
      description: 'Classify in this domain, all types of information exchanges between co-workers as well as all communication devices between co-workers to achieve the operational or functional objectives',
      icon: <MessageSquare className="w-4 h-4 text-green-400" />
    },
    {
      id: 'keyArea4_timeManagement' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 4: Working Time Management',
      description: 'Classify in this domain, everything related to the adequacy of the training and the employment; the training for the resolution of problems or the dysfunctions.',
      icon: <Clock className="w-4 h-4 text-yellow-400" />
    },
    {
      id: 'keyArea5_training' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 5 : On the job Training',
      description: 'Classify in this domain, everything related to the schedule of individuals and the teams (the planning, the programming, the distribution of time between various functions of the individual, etc.)',
      icon: <Award className="w-4 h-4 text-orange-400" />
    },
    {
      id: 'keyArea6_strategy' as keyof SocioeconomicImprovement,
      label: 'KEY AREA 6 : the strategic Implementation',
      description: 'Classify in this domain, everything related to the clear formulation of the strategy and its translation into concrete actions to reach the strategic objectives (financial and technological means) and the human resources policies necessary for the realization of the actions.',
      icon: <Target className="w-4 h-4 text-red-400" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="form-grid">
        {keyAreas.map((area) => (
          <div className="form-field" key={area.id}>
            <div className="min-h-[10rem] flex flex-col">
              <label className="form-label flex items-start space-x-2">
                <span className="flex-shrink-0 mt-1">{area.icon}</span>
                <span>{area.label}</span>
              </label>
              <p className="text-xs text-cfo-muted mb-2 flex-1">{area.description}</p>
            </div>
            <select
              className="form-select"
              value={getDisplayValue(data[area.id])}
              onChange={(e) => handleChange(area.id, e.target.value)}
            >
              <option value="">Select importance level</option>
              {importanceOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}