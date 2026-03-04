import { ExtendedPlayer, PlayerSortField, SortDirection } from '../../types';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlayerListProps {
  players: ExtendedPlayer[];
  isLoading?: boolean;
  sortField: PlayerSortField;
  sortDirection: SortDirection;
  onSort: (field: PlayerSortField) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const sortableColumns: { key: PlayerSortField; label: string }[] = [
  { key: 'name', label: 'Player' },
  { key: 'acs', label: 'ACS' },
  { key: 'adr', label: 'ADR' },
  { key: 'kast_pct', label: 'KAST%' },
  { key: 'sim_rating', label: 'Rating' },
  { key: 'rar_score', label: 'RAR' },
  { key: 'map_count', label: 'Maps' },
];

function SortIcon({
  field,
  currentField,
  direction,
}: {
  field: PlayerSortField;
  currentField: PlayerSortField;
  direction: SortDirection;
}) {
  if (field !== currentField) {
    return <ArrowUpDown className="w-3 h-3 text-radiant-gray/50" />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-4 h-4 text-radiant-red" />
  ) : (
    <ChevronDown className="w-4 h-4 text-radiant-red" />
  );
}

export function PlayerList({
  players,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  page,
  totalPages,
  onPageChange,
}: PlayerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-lg" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-radiant-gray">No players found</p>
        <p className="text-sm text-radiant-gray/60 mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-radiant-border">
              {sortableColumns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-sm font-medium text-radiant-gray cursor-pointer hover:text-white transition-colors"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon
                      field={col.key}
                      currentField={sortField}
                      direction={sortDirection}
                    />
                  </div>
                </th>
              ))}
              <th className="text-left py-3 px-4 text-sm font-medium text-radiant-gray">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <PlayerTableRow key={player.player_id} player={player} index={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {players.map((player) => (
          <PlayerMobileCard key={player.player_id} player={player} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-radiant-border">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-radiant-card border border-radiant-border disabled:opacity-50 disabled:cursor-not-allowed hover:border-radiant-red/30 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-radiant-gray">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-radiant-card border border-radiant-border disabled:opacity-50 disabled:cursor-not-allowed hover:border-radiant-red/30 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerTableRow({
  player,
  index,
}: {
  player: ExtendedPlayer;
  index: number;
}) {
  return (
    <tr className="border-b border-radiant-border/50 hover:bg-radiant-card/50 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/players/${player.player_id}`}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-radiant-red/20 to-radiant-orange/20 flex items-center justify-center text-sm font-bold">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium hover:text-radiant-cyan transition-colors">
              {player.name}
            </p>
            <p className="text-xs text-radiant-gray">
              {player.team || 'No Team'} • {player.role || 'Unknown'}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4 font-mono">{player.acs?.toFixed(1) || '-'}</td>
      <td className="py-3 px-4 font-mono">{player.adr?.toFixed(1) || '-'}</td>
      <td className="py-3 px-4 font-mono">
        {player.kast_pct ? `${player.kast_pct.toFixed(1)}%` : '-'}
      </td>
      <td className="py-3 px-4">
        {player.sim_rating ? (
          <span
            className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded ${
              player.sim_rating >= 1.2
                ? 'bg-radiant-gold/20 text-radiant-gold'
                : player.sim_rating >= 1.0
                ? 'bg-radiant-cyan/20 text-radiant-cyan'
                : 'bg-radiant-gray/20 text-radiant-gray'
            }`}
          >
            {player.sim_rating.toFixed(2)}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="py-3 px-4 font-mono">{player.rar_score?.toFixed(2) || '-'}</td>
      <td className="py-3 px-4 font-mono">{player.map_count || '-'}</td>
      <td className="py-3 px-4">
        {player.investment_grade ? (
          <span className="badge-gold">{player.investment_grade}</span>
        ) : (
          '-'
        )}
      </td>
    </tr>
  );
}

function PlayerMobileCard({ player }: { player: ExtendedPlayer }) {
  return (
    <Link
      to={`/players/${player.player_id}`}
      className="stat-card p-4 block hover:border-radiant-red/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-radiant-red/20 to-radiant-orange/20 flex items-center justify-center font-bold">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{player.name}</p>
          <p className="text-xs text-radiant-gray">
            {player.team || 'No Team'} • {player.role || 'Unknown'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-radiant-gray">ACS</p>
          <p className="font-mono font-semibold">{player.acs?.toFixed(0) || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-radiant-gray">Rating</p>
          <p className="font-mono font-semibold">
            {player.sim_rating?.toFixed(2) || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-radiant-gray">RAR</p>
          <p className="font-mono font-semibold">
            {player.rar_score?.toFixed(2) || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-radiant-gray">Grade</p>
          <p className="font-mono font-semibold">
            {player.investment_grade || '-'}
          </p>
        </div>
      </div>
    </Link>
  );
}
