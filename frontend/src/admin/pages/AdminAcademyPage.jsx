/**
 * Module 04: Academy Curriculum Management
 * Hierarchical inspector of all 7 curriculum stages, units, and levels with publish/unpublish toggles.
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import { adminApi } from '../adminApi';

export const AdminAcademyPage = () => {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});

  const fetchCurriculum = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAcademyCurriculum();
      setStages(res.data?.stages || []);
      // Auto-expand first stage
      if (res.data?.stages?.length > 0) {
        setExpandedStages({ [res.data.stages[0].id]: true });
      }
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const toggleStage = (id) => {
    setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUnit = (id) => {
    setExpandedUnits((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleLevel = async (levelId, currentStatus) => {
    try {
      await adminApi.toggleLevelStatus(levelId, !currentStatus);
      fetchCurriculum();
    } catch (err) {
      alert('Failed to update level publish status.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-[#7357D9]" />
            <span>Academy Curriculum Management</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            7 Stages &bull; 30 Units &bull; 120+ Pedagogical Levels &bull; Progression Architecture
          </p>
        </div>

        <button
          onClick={fetchCurriculum}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
          title="Refresh curriculum"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-[#77748B]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7357D9]" />
          <span className="text-xs">Loading complete academy curriculum structure...</span>
        </div>
      ) : stages.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#9692A7] bg-white border border-[#E8E5F0] rounded-xl">
          No curriculum stages found. Verify lessons migrations have run.
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => {
            const isStageOpen = Boolean(expandedStages[stage.id]);

            return (
              <div
                key={stage.id}
                className="rounded-xl bg-white border border-[#E8E5F0] overflow-hidden shadow-sm transition-all"
              >
                {/* Stage Header */}
                <div
                  onClick={() => toggleStage(stage.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F9F9FD] transition-colors bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center font-bold font-mono text-xs text-[#51419A]">
                      S{stage.stage_number}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#29243B] flex items-center space-x-2">
                        <span>{stage.title}</span>
                        {stage.is_published && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Published
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#77748B] mt-0.5">
                        {stage.pedagogical_focus} &bull; Target: {stage.target_wpm_start}–{stage.target_wpm_end} WPM &bull;{' '}
                        {stage.units_count} units
                      </p>
                    </div>
                  </div>

                  <div className="p-1 rounded text-[#9692A7]">
                    {isStageOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                {/* Stage Units Content */}
                {isStageOpen && (
                  <div className="p-4 space-y-3 bg-[#F7F7FC] border-t border-[#EFEDF5]">
                    {stage.units.map((unit) => {
                      const isUnitOpen = Boolean(expandedUnits[unit.id]);

                      return (
                        <div
                          key={unit.id}
                          className="rounded-lg bg-white border border-[#E8E5F0] overflow-hidden shadow-xs"
                        >
                          <div
                            onClick={() => toggleUnit(unit.id)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#F9F9FD] transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono text-xs font-bold text-[#7357D9]">
                                Unit {unit.unit_number}:
                              </span>
                              <span className="text-xs font-semibold text-[#29243B]">{unit.title}</span>
                              <span className="text-[10px] text-[#9692A7] font-mono">
                                ({unit.levels_count} levels)
                              </span>
                            </div>

                            <div className="text-[#9692A7]">
                              {isUnitOpen ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          </div>

                          {/* Levels Table */}
                          {isUnitOpen && (
                            <div className="p-3 border-t border-[#EFEDF5] bg-white">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-[10px] uppercase font-semibold text-[#77748B] border-b border-[#EFEDF5]">
                                    <th className="py-2 px-3">Logical ID</th>
                                    <th className="py-2 px-3">Level Title</th>
                                    <th className="py-2 px-3">Target WPM</th>
                                    <th className="py-2 px-3">Min Accuracy</th>
                                    <th className="py-2 px-3 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EFEDF5]">
                                  {unit.levels.map((lvl) => (
                                    <tr key={lvl.id} className="hover:bg-[#F9F9FD] text-[#29243B] transition-colors">
                                      <td className="py-2 px-3 font-mono text-[11px] text-[#7357D9]">
                                        {lvl.logical_id}
                                      </td>
                                      <td className="py-2 px-3 font-medium text-[#29243B]">{lvl.title}</td>
                                      <td className="py-2 px-3 font-mono text-[#77748B]">{lvl.target_wpm} WPM</td>
                                      <td className="py-2 px-3 font-mono text-[#77748B]">{lvl.target_accuracy}%</td>
                                      <td className="py-2 px-3 text-right">
                                        <button
                                          onClick={() => handleToggleLevel(lvl.id, lvl.is_published)}
                                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                                            lvl.is_published
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : 'bg-[#F7F7FC] text-[#77748B] border border-[#E8E5F0]'
                                          }`}
                                        >
                                          {lvl.is_published ? (
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                          ) : (
                                            <XCircle className="w-2.5 h-2.5" />
                                          )}
                                          <span>{lvl.is_published ? 'Published' : 'Hidden'}</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

