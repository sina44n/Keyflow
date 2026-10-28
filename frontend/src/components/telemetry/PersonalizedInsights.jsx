import React from 'react';
import { Link } from 'react-router-dom';
import { generatePersonalizedInsights } from '../../utils/telemetryStorage';

/**
 * PersonalizedInsights
 * 
 * Renders data-driven recommendations and practice guidance derived from
 * measured keystroke analytics. Connects directly to Academy and Workstation.
 */
export default function PersonalizedInsights({ metrics, sessions = [] }) {
  const insights = React.useMemo(() => {
    return generatePersonalizedInsights(metrics, sessions);
  }, [metrics, sessions]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'weak_finger':
        return '🖐️';
      case 'difficult_chars':
        return '🎯';
      case 'speed_accuracy_balance':
        return '⚖️';
      case 'consistency':
        return '🔥';
      default:
        return '💡';
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'warning':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-500';
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500';
      case 'achievement':
        return 'border-indigo-500/40 bg-indigo-500/5 text-indigo-500';
      default:
        return 'border-sky-500/40 bg-sky-500/5 text-sky-500';
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="pb-4 border-b border-[var(--border)]">
        <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
          Scientific Recommendations & Insights
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Objective, biomechanically derived practice guidance inferred from your actual typing sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {insights.map((insight, idx) => {
          const categoryName = (insight.category || insight.type || 'tip').replace(/_/g, ' ');
          const actionLink = insight.actionLink || insight.actionHref;
          const actionText = insight.actionText || insight.actionLabel || 'Practice Now';

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${getCategoryColor(
                insight.type
              )}`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getCategoryIcon(insight.category)}</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {categoryName}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {actionLink && (
                <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
                  <Link
                    to={actionLink}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:underline"
                  >
                    {actionText} →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
