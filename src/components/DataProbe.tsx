import React, { useState, useRef, useEffect } from 'react';
import { Pin, X, Edit3, Check, Thermometer, Grid, Layers, Target, Flame } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import { getProbeData, formatTemperature, formatDistance, generateId } from '../lib/utils';
import useSimulation from '../hooks/useSimulation';
import type { ProbeData, PinnedProbe } from '@shared/types';

interface DataProbeProps {
  mousePosition: { x: number; y: number } | null;
  gridCell: { x: number; y: number } | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const DataProbe: React.FC<DataProbeProps> = ({
  mousePosition,
  gridCell,
  canvasRef,
}) => {
  const {
    currentTemperature,
    maxTemperature,
    materials,
    materialId,
    initialHeatSources,
    pinnedProbes,
    addPinnedProbe,
    removePinnedProbe,
    updatePinnedProbeNote,
    mode,
    currentStep,
  } = useSimulationStore();

  const { isRunning, isPaused, isIdle, isFinished } = useSimulation();

  const [editingProbeId, setEditingProbeId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const canPin = isPaused || isIdle || isFinished;

  const probeData: ProbeData | null = gridCell
    ? getProbeData(
        gridCell.x,
        gridCell.y,
        currentTemperature,
        maxTemperature,
        materials,
        materialId,
        initialHeatSources
      )
    : null;

  useEffect(() => {
    if (mousePosition && canvasRef.current && tooltipRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;

      let x = mousePosition.x + 15;
      let y = mousePosition.y + 15;

      if (x + tooltipWidth > rect.width) {
        x = mousePosition.x - tooltipWidth - 15;
      }
      if (y + tooltipHeight > rect.height) {
        y = mousePosition.y - tooltipHeight - 15;
      }

      setTooltipPos({ x, y });
    }
  }, [mousePosition, canvasRef]);

  const handlePinProbe = () => {
    if (!probeData || !canPin) return;

    const pinned: PinnedProbe = {
      id: generateId(),
      data: { ...probeData },
      note: '',
      step: currentStep,
      timestamp: Date.now(),
    };

    addPinnedProbe(pinned);
  };

  const handleStartEditNote = (probe: PinnedProbe) => {
    if (!canPin) return;
    setEditingProbeId(probe.id);
    setEditNote(probe.note);
  };

  const handleSaveNote = (id: string) => {
    updatePinnedProbeNote(id, editNote);
    setEditingProbeId(null);
    setEditNote('');
  };

  if (!probeData || !mousePosition) {
    if (pinnedProbes.length === 0) {
      return null;
    }
    return (
      <>
        {pinnedProbes.map((probe) => (
          <PinnedProbeMarker
            key={probe.id}
            probe={probe}
            canvasRef={canvasRef}
            onRemove={() => removePinnedProbe(probe.id)}
            onEditNote={() => handleStartEditNote(probe)}
            isEditing={editingProbeId === probe.id}
            editNote={editNote}
            onEditNoteChange={setEditNote}
            onSaveNote={() => handleSaveNote(probe.id)}
            canEdit={canPin}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <div
        ref={tooltipRef}
        className="absolute z-20 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl p-3 min-w-[200px]"
        style={{
          left: tooltipPos.x,
          top: tooltipPos.y,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">数据探针</span>
          </div>
          <button
            onClick={handlePinProbe}
            disabled={!canPin}
            className={`p-1 rounded-lg transition-all ${
              canPin
                ? 'hover:bg-slate-700 text-slate-400 hover:text-yellow-400'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title={canPin ? '固定探针' : '运行中无法固定'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Grid className="w-3 h-3" />
              <span>坐标</span>
            </div>
            <span className="font-mono text-slate-200">
              ({probeData.x}, {probeData.y})
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span>当前温度</span>
            </div>
            <span className="font-mono font-semibold text-orange-400">
              {formatTemperature(probeData.temperature)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>材料</span>
            </div>
            <span className="text-slate-200">{probeData.materialName}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Target className="w-3 h-3 text-green-400" />
              <span>最近热源</span>
            </div>
            <span className="font-mono text-slate-200">
              {formatDistance(probeData.nearestHeatSourceDistance)} 格
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Flame className="w-3 h-3 text-red-400" />
              <span>历史最高</span>
            </div>
            <span className="font-mono font-semibold text-red-400">
              {formatTemperature(probeData.historicalMaxTemp)}
            </span>
          </div>
        </div>

        {isRunning && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              运行中 - 只读模式
            </div>
          </div>
        )}
      </div>

      {pinnedProbes.map((probe) => (
        <PinnedProbeMarker
          key={probe.id}
          probe={probe}
          canvasRef={canvasRef}
          onRemove={() => removePinnedProbe(probe.id)}
          onEditNote={() => handleStartEditNote(probe)}
          isEditing={editingProbeId === probe.id}
          editNote={editNote}
          onEditNoteChange={setEditNote}
          onSaveNote={() => handleSaveNote(probe.id)}
          canEdit={canPin}
        />
      ))}
    </>
  );
};

interface PinnedProbeMarkerProps {
  probe: PinnedProbe;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onRemove: () => void;
  onEditNote: () => void;
  isEditing: boolean;
  editNote: string;
  onEditNoteChange: (value: string) => void;
  onSaveNote: () => void;
  canEdit: boolean;
}

const PinnedProbeMarker: React.FC<PinnedProbeMarkerProps> = ({
  probe,
  canvasRef,
  onRemove,
  onEditNote,
  isEditing,
  editNote,
  onEditNoteChange,
  onSaveNote,
  canEdit,
}) => {
  const { grid } = useSimulationStore();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;

      setPos({
        x: probe.data.x * grid.cellSize * scaleX,
        y: probe.data.y * grid.cellSize * scaleY,
      });
    }
  }, [probe.data.x, probe.data.y, grid.cellSize, canvasRef]);

  return (
    <>
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: pos.x,
          top: pos.y,
        }}
      >
        <div className="w-4 h-4 -ml-2 -mt-2 bg-yellow-400 rounded-full border-2 border-white shadow-lg shadow-yellow-400/50 animate-pulse" />
        <div className="w-8 h-8 -ml-4 -mt-4 border-2 border-yellow-400/50 rounded-full absolute top-0 left-0 animate-ping" />
      </div>

      <div
        className="absolute z-10 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-yellow-500/50 rounded-lg shadow-xl p-2 min-w-[160px]"
        style={{
          left: pos.x + 12,
          top: pos.y + 12,
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-semibold text-yellow-400">
              第 {probe.step} 步
            </span>
          </div>
          {canEdit && (
            <button
              onClick={onRemove}
              className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">温度</span>
            <span className="font-mono text-orange-400">
              {formatTemperature(probe.data.temperature)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">坐标</span>
            <span className="font-mono text-slate-400">
              ({probe.data.x}, {probe.data.y})
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
            <div className="flex gap-1">
              <input
                type="text"
                value={editNote}
                onChange={(e) => onEditNoteChange(e.target.value)}
                placeholder="添加备注..."
                autoFocus
                className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveNote();
                  }
                }}
              />
              <button
                onClick={onSaveNote}
                className="p-1 bg-yellow-500 hover:bg-yellow-400 rounded text-slate-900 transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {probe.note && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-400 line-clamp-2">{probe.note}</p>
              </div>
            )}
            {canEdit && !probe.note && (
              <button
                onClick={onEditNote}
                className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 text-[10px] text-slate-500 hover:text-yellow-400 hover:bg-slate-800 rounded transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                添加备注
              </button>
            )}
            {canEdit && probe.note && (
              <button
                onClick={onEditNote}
                className="mt-1 w-full flex items-center justify-center gap-1 py-0.5 text-[9px] text-slate-500 hover:text-yellow-400 transition-colors"
              >
                <Edit3 className="w-2.5 h-2.5" />
                编辑备注
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default DataProbe;
