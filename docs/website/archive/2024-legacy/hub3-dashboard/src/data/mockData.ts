export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  simRating: number;
  trend: number[];
  photo: string;
}

export interface Metrics {
  totalPlayers: number;
  avgSimRating: number;
  topPerformer: string;
  weeklyGrowth: number;
}

export interface PerformanceData {
  date: string;
  rating: number;
  projected: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

export const topPerformers: Player[] = [
  {
    id: '1',
    name: 'Alex Chen',
    team: 'Dragons',
    position: 'Carry',
    simRating: 94.2,
    trend: [89, 90, 91, 92, 93, 93.5, 94.2],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    team: 'Phoenix',
    position: 'Mid',
    simRating: 92.8,
    trend: [88, 89, 90, 91, 91.5, 92, 92.8],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
  },
  {
    id: '3',
    name: 'James Wilson',
    team: 'Titans',
    position: 'Support',
    simRating: 91.5,
    trend: [87, 88, 88.5, 89, 90, 90.5, 91.5],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james'
  },
  {
    id: '4',
    name: 'Sofia Kim',
    team: 'Vipers',
    position: 'Offlane',
    simRating: 90.3,
    trend: [85, 86, 87, 88, 89, 89.5, 90.3],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia'
  },
  {
    id: '5',
    name: 'Marcus Johnson',
    team: 'Wolves',
    position: 'Jungle',
    simRating: 89.7,
    trend: [84, 85, 86, 87, 88, 88.5, 89.7],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus'
  }
];

export const performanceHistory: PerformanceData[] = [
  { date: 'Week 1', rating: 82, projected: 85 },
  { date: 'Week 2', rating: 84, projected: 86 },
  { date: 'Week 3', rating: 86, projected: 87 },
  { date: 'Week 4', rating: 85, projected: 88 },
  { date: 'Week 5', rating: 88, projected: 89 },
  { date: 'Week 6', rating: 90, projected: 90 },
  { date: 'Week 7', rating: 91, projected: 91 },
  { date: 'Week 8', rating: 93, projected: 92 },
];

export const comparativeStats = [
  { name: 'Dragons', wins: 45, losses: 12, kda: 4.2 },
  { name: 'Phoenix', wins: 42, losses: 15, kda: 3.8 },
  { name: 'Titans', wins: 38, losses: 19, kda: 3.5 },
  { name: 'Vipers', wins: 35, losses: 22, kda: 3.2 },
  { name: 'Wolves', wins: 33, losses: 24, kda: 3.0 },
];

export const roleDistribution: RoleDistribution[] = [
  { role: 'Carry', count: 28, percentage: 28 },
  { role: 'Mid', count: 24, percentage: 24 },
  { role: 'Support', count: 22, percentage: 22 },
  { role: 'Offlane', count: 15, percentage: 15 },
  { role: 'Jungle', count: 11, percentage: 11 },
];

export const currentMetrics: Metrics = {
  totalPlayers: 342,
  avgSimRating: 76.4,
  topPerformer: 'Alex Chen',
  weeklyGrowth: 12.5,
};

export const investmentGrades = [
  { player: 'Alex Chen', grade: 'A+', risk: 'Low', potential: 'Elite' },
  { player: 'Maria Rodriguez', grade: 'A', risk: 'Low', potential: 'Elite' },
  { player: 'James Wilson', grade: 'A-', risk: 'Low-Med', potential: 'High' },
  { player: 'Sofia Kim', grade: 'B+', risk: 'Medium', potential: 'High' },
  { player: 'Marcus Johnson', grade: 'B', risk: 'Medium', potential: 'Good' },
  { player: 'Chris Lee', grade: 'C+', risk: 'Med-High', potential: 'Average' },
  { player: 'Emma Davis', grade: 'C', risk: 'High', potential: 'Average' },
  { player: 'Ryan Park', grade: 'D', risk: 'Very High', potential: 'Below Avg' },
];
