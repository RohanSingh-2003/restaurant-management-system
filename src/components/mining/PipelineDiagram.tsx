interface PipelineDiagramProps {
  stages: string[];
  activeStage?: number;
}

export function PipelineDiagram({ stages, activeStage }: PipelineDiagramProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2 overflow-x-auto text-xs">
      {stages.map((stage, idx) => {
        const isCompleted = activeStage !== undefined && idx <= activeStage;
        return (
          <div key={stage} className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                isCompleted
                  ? 'bg-accent/10 text-accent border border-accent/30 font-semibold'
                  : 'bg-neutral-50 text-neutral-500 border border-neutral-200/70'
              }`}
            >
              {stage}
            </span>
            {idx < stages.length - 1 && (
              <span className="text-neutral-300 font-mono">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
