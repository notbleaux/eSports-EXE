/**
 * ScheduleViewer Component
 * Show match schedule for selected tournament
 * [Ver001.001]
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, CheckCircle, Calendar, ExternalLink, Trophy } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useMatches } from '@/shared/api/hooks';
import type { MatchSchedule, Tournament, MatchStatus } from '../types';

// Purple theme colors
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

interface ScheduleViewerProps {
  schedules: MatchSchedule[];
  tournament: Tournament | null;
  loading: boolean;
}

function ScheduleViewer({ schedules: _schedulesProp, tournament, loading }: ScheduleViewerProps): JSX.Element {
  const { data, isLoading, isError } = useMatches('valorant', 'not_started');

  if (isLoading) return <div className="loading">Loading matches...</div>;
  if (isError) return <div className="error">Failed to load match data.</div>;

  const liveMatches = data?.matches ?? [];

  // Map Match objects from the API to MatchSchedule shape for rendering
  const schedules: MatchSchedule[] = liveMatches.map((m) => ({
    schedule_id: Number(m.id) || 0,
    tournament_id: 0,
    match_id: m.id,
    round_name: '',
    stage: undefined,
    team_a_id: undefined,
    team_b_id: undefined,
    team_a_name: m.teamA.name,
    team_b_name: m.teamB.name,
    scheduled_at: m.scheduledAt,
    stream_url: undefined,
    status: m.status === 'upcoming' ? 'scheduled' : (m.status as MatchStatus),
    team_a_score: undefined,
    team_b_score: undefined,
    winner_team_id: undefined,
    duration_minutes: undefined,
    sator_match_ref: undefined,
    created_at: m.scheduledAt,
    updated_at: m.scheduledAt,
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'live':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      case 'completed':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'scheduled':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const isLive = (status: MatchStatus) => status === 'live';
  const isCompleted = (status: MatchStatus) => status === 'completed';

  // Group schedules by stage
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const stage = schedule.stage || 'Other';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(schedule);
    return acc;
  }, {} as Record<string, MatchSchedule[]>);

  // Sort stages: Groups first, then Playoffs, then Finals
  const stageOrder = ['Groups', 'Playoffs', 'Finals'];
  const sortedStages = Object.keys(groupedSchedules).sort((a, b) => {
    const aIndex = stageOrder.indexOf(a);
    const bIndex = stageOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  if (!tournament) {
    return (
      <GlassCard className="p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: PURPLE.base }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: PURPLE.base }}>
          Select a Tournament
        </h3>
        <p className="text-sm opacity-60">
          Choose a tournament from the list to view its schedule
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6" style={{ color: PURPLE.base }} />
          <div>
            <h2 className="font-semibold" style={{ color: PURPLE.base }}>
              {tournament.name}
            </h2>
            <p className="text-xs opacity-60">
              {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Schedule List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 rounded-full"
            style={{ borderColor: `${PURPLE.base} transparent ${PURPLE.base} transparent` }}
          />
        </div>
      ) : schedules.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: PURPLE.base }} />
          <p className="text-sm opacity-60">No matches scheduled yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {sortedStages.map((stage) => (
            <div key={stage}>
              {/* Stage Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium uppercase tracking-wider opacity-60">
                  {stage}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Matches */}
              <div className="space-y-3">
                {groupedSchedules[stage].map((match, index) => {
                  const statusStyle = getStatusColor(match.status);
                  const hasScores = isCompleted(match.status) && 
                    match.team_a_score !== undefined && 
                    match.team_b_score !== undefined;

                  return (
                    <motion.div
                      key={match.schedule_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GlassCard 
                        className={`p-4 relative overflow-hidden ${isLive(match.status) ? 'ring-1 ring-red-500/30' : ''}`}
                      >
                        {/* Live indicator pulse */}
                        {isLive(match.status) && (
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                          {/* Team A */}
                          <div className="flex-1 text-right">
                            <div className="font-medium text-sm">
                              {match.team_a_name || 'TBD'}
                            </div>
                            {hasScores && (
                              <div className={`text-2xl font-bold ${
                                (match.team_a_score || 0) > (match.team_b_score || 0) 
                                  ? 'text-white' 
                                  : 'opacity-50'
                              }`}>
                                {match.team_a_score}
                              </div>
                            )}
                          </div>

                          {/* VS / Status */}
                          <div className="flex flex-col items-center px-4">
                            {hasScores ? (
                              <span className="text-xs opacity-40 uppercase tracking-wider">vs</span>
                            ) : (
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                                {getStatusIcon(match.status)}
                                <span className="text-xs font-medium uppercase">
                                  {match.status}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Team B */}
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">
                              {match.team_b_name || 'TBD'}
                            </div>
                            {hasScores && (
                              <div className={`text-2xl font-bold ${
                                (match.team_b_score || 0) > (match.team_a_score || 0) 
                                  ? 'text-white' 
                                  : 'opacity-50'
                              }`}>
                                {match.team_b_score}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs opacity-60">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(match.scheduled_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(match.scheduled_at)}
                            </span>
                            <span className="opacity-70">{match.round_name}</span>
                          </div>
                          
                          {match.stream_url && (
                            <a
                              href={match.stream_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                              style={{ color: PURPLE.base }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Play className="w-3 h-3" />
                              Watch
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduleViewer;
