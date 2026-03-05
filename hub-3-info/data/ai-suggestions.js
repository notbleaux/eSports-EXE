/**
 * AI Suggestions Data
 * Contextual recommendations based on user role
 */

export const AI_SUGGESTIONS = {
  roles: {
    player: {
      title: 'Player',
      icon: '🎮',
      description: 'Competitive gamers looking to improve',
      suggestions: [
        {
          id: 'player-1',
          type: 'team',
          title: 'Join a Team',
          description: 'Find teams looking for players with your skill level and game preferences.',
          action: 'Browse Teams',
          priority: 'high'
        },
        {
          id: 'player-2',
          type: 'tournament',
          title: 'Upcoming Tournaments',
          description: '3 tournaments match your rank and availability this week.',
          action: 'View Tournaments',
          priority: 'high'
        },
        {
          id: 'player-3',
          type: 'training',
          title: 'Skill Assessment',
          description: 'Complete your profile to get personalized training recommendations.',
          action: 'Start Assessment',
          priority: 'medium'
        },
        {
          id: 'player-4',
          type: 'analytics',
          title: 'Performance Insights',
          description: 'Your aim accuracy has improved 15% this month. View detailed breakdown.',
          action: 'View Analytics',
          priority: 'medium'
        }
      ]
    },
    team_manager: {
      title: 'Team Manager',
      icon: '👥',
      description: 'Leaders managing esports teams',
      suggestions: [
        {
          id: 'manager-1',
          type: 'recruitment',
          title: 'Player Recruitment',
          description: '12 players match your team\'s requirements. Review applications.',
          action: 'Review Candidates',
          priority: 'high'
        },
        {
          id: 'manager-2',
          type: 'schedule',
          title: 'Schedule Optimization',
          description: 'AI suggests rescheduling 2 practice sessions for better performance.',
          action: 'View Schedule',
          priority: 'high'
        },
        {
          id: 'manager-3',
          type: 'scouting',
          title: 'Opponent Analysis',
          description: 'Complete scouting report available for your next match opponent.',
          action: 'View Report',
          priority: 'medium'
        },
        {
          id: 'manager-4',
          type: 'finance',
          title: 'Sponsorship Opportunities',
          description: '3 brands are interested in partnership based on your team performance.',
          action: 'View Offers',
          priority: 'medium'
        }
      ]
    },
    coach: {
      title: 'Coach',
      icon: '📋',
      description: 'Trainers developing player skills',
      suggestions: [
        {
          id: 'coach-1',
          type: 'training',
          title: 'Training Plan Generator',
          description: 'AI-generated training plan based on your team\'s recent performance.',
          action: 'Generate Plan',
          priority: 'high'
        },
        {
          id: 'coach-2',
          type: 'analytics',
          title: 'Team Weakness Analysis',
          description: 'Identified 3 key areas for improvement from recent matches.',
          action: 'View Analysis',
          priority: 'high'
        },
        {
          id: 'coach-3',
          type: 'resources',
          title: 'Strategy Library',
          description: 'New strategies added for your game category. 15 guides available.',
          action: 'Browse Library',
          priority: 'medium'
        },
        {
          id: 'coach-4',
          type: 'workshop',
          title: 'Coaching Workshop',
          description: 'Monthly workshop on advanced analytics starts tomorrow.',
          action: 'Register Now',
          priority: 'low'
        }
      ]
    },
    analyst: {
      title: 'Analyst',
      icon: '📊',
      description: 'Data experts providing insights',
      suggestions: [
        {
          id: 'analyst-1',
          type: 'data',
          title: 'New Data Sets Available',
          description: 'Patch 12.4 data now available for analysis across 500+ matches.',
          action: 'Access Data',
          priority: 'high'
        },
        {
          id: 'analyst-2',
          type: 'report',
          title: 'Automated Reports',
          description: 'Weekly meta report generated. 12 key changes identified.',
          action: 'View Report',
          priority: 'high'
        },
        {
          id: 'analyst-3',
          type: 'visualization',
          title: 'New Visualization Tools',
          description: '3D heatmaps and trajectory analysis now available.',
          action: 'Try Tools',
          priority: 'medium'
        },
        {
          id: 'analyst-4',
          type: 'collaboration',
          title: 'Analyst Network',
          description: '5 analysts in your region are sharing insights on current meta.',
          action: 'Join Discussion',
          priority: 'low'
        }
      ]
    },
    organizer: {
      title: 'Tournament Organizer',
      icon: '🏆',
      description: 'Event planners and hosts',
      suggestions: [
        {
          id: 'organizer-1',
          type: 'event',
          title: 'Event Templates',
          description: 'New tournament format templates available based on popular demand.',
          action: 'Browse Templates',
          priority: 'high'
        },
        {
          id: 'organizer-2',
          type: 'registration',
          title: 'Registration Drive',
          description: 'Early bird registration ends in 48 hours. 23 teams registered.',
          action: 'View Status',
          priority: 'high'
        },
        {
          id: 'organizer-3',
          type: 'broadcast',
          title: 'Broadcast Tools',
          description: 'Updated overlay pack and observer tools released.',
          action: 'Download',
          priority: 'medium'
        },
        {
          id: 'organizer-4',
          type: 'sponsors',
          title: 'Sponsor Matching',
          description: 'AI matched 4 potential sponsors for your event category.',
          action: 'View Matches',
          priority: 'medium'
        }
      ]
    },
    spectator: {
      title: 'Spectator',
      icon: '👁️',
      description: 'Fans and viewers',
      suggestions: [
        {
          id: 'spectator-1',
          type: 'match',
          title: 'Live Matches',
          description: '8 matches streaming now in games you follow.',
          action: 'Watch Now',
          priority: 'high'
        },
        {
          id: 'spectator-2',
          type: 'team',
          title: 'Follow Teams',
          description: 'Teams similar to your favorites are competing this week.',
          action: 'Discover Teams',
          priority: 'medium'
        },
        {
          id: 'spectator-3',
          type: 'prediction',
          title: 'Prediction Game',
          description: 'Make predictions on upcoming matches to win prizes.',
          action: 'Make Predictions',
          priority: 'medium'
        },
        {
          id: 'spectator-4',
          type: 'community',
          title: 'Community Events',
          description: 'Join watch parties and fan discussions happening now.',
          action: 'Join Community',
          priority: 'low'
        }
      ]
    }
  }
};

export const getSuggestionsByRole = (role) => AI_SUGGESTIONS.roles[role] || AI_SUGGESTIONS.roles.spectator;

export default AI_SUGGESTIONS;
