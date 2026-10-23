"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { LivestockGroupDTO } from "@/lib/types";
import { Layers, Plus, Edit2, Archive, Users, Calendar, ArrowRight } from "lucide-react";

interface GroupListProps {
  groups: LivestockGroupDTO[];
  onNewGroup: () => void;
  onEditGroup: (group: LivestockGroupDTO) => void;
  onArchiveGroup: (groupId: string) => void;
}

export function GroupList({
  groups,
  onNewGroup,
  onEditGroup,
  onArchiveGroup,
}: GroupListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-farm-primary tracking-tight">
            Animal Groups, Flocks & Production Batches
          </h3>
          <p className="text-xs text-farm-slate">
            Organize individual flocks, milking herds, rearing pens, and nursery cages.
          </p>
        </div>

        <button
          onClick={onNewGroup}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-farm-primary hover:bg-farm-primaryDark text-white rounded-xl text-xs font-bold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-farm-lime" />
          <span>New Group / Batch</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-farm-surface border border-dashed border-farm-border rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-farm-charcoal">No animal groups configured</h4>
            <p className="text-xs text-farm-slate mt-0.5 max-w-sm mx-auto">
              Create your first flock, herd, or production batch to start attributing feed rations and output yields.
            </p>
          </div>
          <button
            onClick={onNewGroup}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-farm-primary text-white rounded-xl text-xs font-bold hover:bg-farm-primaryDark transition-colors shadow-xs"
          >
            <span>+ Create First Group</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            let startDateFormatted = g.startDate;
            try {
              startDateFormatted = format(parseISO(g.startDate), "dd MMM yyyy");
            } catch {}

            return (
              <div
                key={g.id}
                className="bg-farm-surface border border-farm-border rounded-2xl p-5 shadow-xs hover:border-farm-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        {g.species.replace("_", " ")}
                      </span>
                      <h4 className="text-sm font-black text-farm-charcoal mt-2 tracking-tight">
                        {g.name}
                      </h4>
                      <p className="text-xs text-farm-slate mt-0.5">
                        Enterprise: {g.enterpriseName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditGroup(g)}
                        className="p-1.5 rounded-lg text-farm-slate hover:text-farm-primary hover:bg-farm-bg transition-colors"
                        title="Edit Group"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Archive group "${g.name}"?`)) {
                            onArchiveGroup(g.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-farm-slate hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Archive Group"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-farm-border/60 text-xs">
                    <div>
                      <span className="text-[11px] text-farm-muted">Active Count:</span>
                      <p className="font-black text-farm-charcoal text-sm">
                        {g.currentCount.toLocaleString()}
                        <span className="text-[11px] font-normal text-farm-slate ml-1">
                          / {g.initialCount}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-farm-muted">Stage:</span>
                      <p className="font-bold text-farm-charcoal truncate">
                        {g.productionStage || "Active"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-farm-muted">Breed:</span>
                      <p className="font-medium text-farm-slate truncate">
                        {g.breed || "Standard"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-farm-muted">Started:</span>
                      <p className="font-medium text-farm-slate">{startDateFormatted}</p>
                    </div>
                  </div>
                </div>

                {/* Footer records count */}
                <div className="pt-2 border-t border-farm-border/40 flex items-center justify-between text-[11px] text-farm-muted">
                  <span>{g._count?.feedRecords || 0} feed entries</span>
                  <span>{g._count?.productionRecords || 0} output logs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
