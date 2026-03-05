/**
 * Tier Comparison Data
 * NJZ 4eva vs Nvr Die feature matrix
 */

export const TIER_COMPARISON = {
  tiers: [
    {
      id: 'njz-4eva',
      name: 'NJZ 4eva',
      tagline: 'The Eternal Championship',
      color: '#c9b037',
      gradient: 'linear-gradient(135deg, #c9b037 0%, #e8d57a 50%, #c9b037 100%)',
      icon: '👑',
      price: 'Premium',
      description: 'For organizations seeking eternal legacy in esports'
    },
    {
      id: 'njz-nvrdie',
      name: 'NJZ Nvr Die',
      tagline: 'Rise Again, Always',
      color: '#7a7874',
      gradient: 'linear-gradient(135deg, #7a7874 0%, #9a9894 50%, #7a7874 100%)',
      icon: '⚡',
      price: 'Standard',
      description: 'For emerging teams with unstoppable spirit'
    }
  ],
  features: [
    {
      category: 'Platform Access',
      items: [
        { name: 'Team Profiles', njz4eva: true, nvrdie: true, njz4evaLabel: 'Unlimited Customization', nvrdieLabel: 'Standard' },
        { name: 'Match History', njz4eva: true, nvrdie: true, njz4evaLabel: 'Advanced Analytics', nvrdieLabel: 'Basic' },
        { name: 'Tournament Access', njz4eva: true, nvrdie: true, njz4evaLabel: 'Priority Entry', nvrdieLabel: 'Standard' },
        { name: 'Custom Tournaments', njz4eva: true, nvrdie: false, njz4evaLabel: 'Unlimited Creation', nvrdieLabel: '-' },
        { name: 'White-label Solution', njz4eva: true, nvrdie: false, njz4evaLabel: 'Full Branding', nvrdieLabel: '-' }
      ]
    },
    {
      category: 'Analytics & Insights',
      items: [
        { name: 'Performance Metrics', njz4eva: true, nvrdie: true, njz4evaLabel: 'Real-time + Predictive', nvrdieLabel: 'Real-time' },
        { name: 'Team Analytics', njz4eva: true, nvrdie: true, njz4evaLabel: 'Deep Learning Models', nvrdieLabel: 'Standard' },
        { name: 'Opponent Scouting', njz4eva: true, nvrdie: false, njz4evaLabel: 'AI-Powered Reports', nvrdieLabel: '-' },
        { name: 'Heat Maps', njz4eva: true, nvrdie: false, njz4evaLabel: '3D Visualization', nvrdieLabel: '-' },
        { name: 'Historical Data', njz4eva: true, nvrdie: true, njz4evaLabel: 'Unlimited Archive', nvrdieLabel: '2 Years' }
      ]
    },
    {
      category: 'Community & Social',
      items: [
        { name: 'Fan Engagement', njz4eva: true, nvrdie: true, njz4evaLabel: 'Advanced Tools', nvrdieLabel: 'Basic' },
        { name: 'Social Integration', njz4eva: true, nvrdie: true, njz4evaLabel: 'All Platforms', nvrdieLabel: 'Major Platforms' },
        { name: 'Merchandise Store', njz4eva: true, nvrdie: false, njz4evaLabel: 'Integrated', nvrdieLabel: '-' },
        { name: 'Fan Tokens', njz4eva: true, nvrdie: false, njz4evaLabel: 'Blockchain Enabled', nvrdieLabel: '-' },
        { name: 'Community Events', njz4eva: true, nvrdie: true, njz4evaLabel: 'Unlimited Hosting', nvrdieLabel: 'Limited' }
      ]
    },
    {
      category: 'Support & Services',
      items: [
        { name: 'Customer Support', njz4eva: true, nvrdie: true, njz4evaLabel: '24/7 Dedicated', nvrdieLabel: 'Business Hours' },
        { name: 'Account Manager', njz4eva: true, nvrdie: false, njz4evaLabel: 'Dedicated', nvrdieLabel: '-' },
        { name: 'Training Sessions', njz4eva: true, nvrdie: false, njz4evaLabel: 'Monthly Workshops', nvrdieLabel: '-' },
        { name: 'API Access', njz4eva: true, nvrdie: true, njz4evaLabel: 'Full + Webhooks', nvrdieLabel: 'Read-only' },
        { name: 'Custom Development', njz4eva: true, nvrdie: false, njz4evaLabel: 'Available', nvrdieLabel: '-' }
      ]
    },
    {
      category: 'Competition',
      items: [
        { name: 'League Participation', njz4eva: true, nvrdie: true, njz4evaLabel: 'All Tiers', nvrdieLabel: 'Up to Tier B' },
        { name: 'Prize Pool Eligibility', njz4eva: true, nvrdie: true, njz4evaLabel: 'Unlimited', nvrdieLabel: 'Up to $100K' },
        { name: 'Sponsored Events', njz4eva: true, nvrdie: false, njz4evaLabel: 'Exclusive Access', nvrdieLabel: '-' },
        { name: 'Global Rankings', njz4eva: true, nvrdie: true, njz4evaLabel: 'Featured Placement', nvrdieLabel: 'Standard' },
        { name: 'Scouting Network', njz4eva: true, nvrdie: false, njz4evaLabel: 'Full Access', nvrdieLabel: '-' }
      ]
    }
  ],
  highlights: {
    njz4eva: [
      'Unlimited everything',
      'AI-powered insights',
      'White-label branding',
      '24/7 dedicated support',
      'Blockchain fan tokens',
      'Custom development'
    ],
    nvrdie: [
      'Essential features',
      'Real-time analytics',
      'Community tools',
      'Standard support',
      'Tournament access',
      'Growth ready'
    ]
  }
};

export default TIER_COMPARISON;
