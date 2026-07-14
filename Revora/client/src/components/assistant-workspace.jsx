import React, { useState } from "react";
import { AlertTriangle, BarChart3, BotMessageSquare, CalendarCheck, ClipboardCheck, History, Send, ShieldCheck, Target, Zap } from "lucide-react";
import { EmptyState, SectionHeader, SummaryCard, WarningPanel, WorkspacePanel } from "./common";
import { formatCurrency, formatNumber } from "../utils/formatters";

function severityStyles(severity) {
  if (severity === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (severity === "warning") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function labelValue(label, value) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value !== null && value !== undefined && value !== "" ? value : "Unknown"}</p>
    </div>
  );
}

function displayPriceMove(value) {
  return value === "unchanged" ? "flat" : value;
}

function optionalCurrency(value, currency) {
  return value !== null && value !== undefined ? formatCurrency(value, currency) : "Unknown";
}

function DecisionInsights({ decision, currency }) {
  const analytics = decision.precisionAnalytics;
  const root = decision.advice?.theoreticalRoot;
  const caseStudy = decision.advice?.historicalPrecedent;

  if (!analytics && !root && !caseStudy) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      {/* Mentor Support: Math & ML Space Combined */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
        <ShieldCheck size={14} />
        Mentor Support: Math & ML Space
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Math Space Section */}
        {analytics && (
          <div className="rounded-md bg-slate-900 p-4 text-white shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Math Space: {analytics.formulaLabel || "Rough estimate"}</p>
            <p className="mt-1 font-mono text-xs text-indigo-300">{analytics.optimalPriceFormula}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase opacity-60">Elasticity</p>
                <p className="text-xl font-bold text-white">{analytics.elasticityEstimate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-emerald-400 opacity-80">Range</p>
                <p className="text-xs font-semibold">
                  {formatCurrency(analytics.confidenceInterval.low, currency)} - {formatCurrency(analytics.confidenceInterval.high, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ML & Theory Space Section */}
        <div className="space-y-2">
          {root && (
            <div className="rounded-md border-l-4 border-indigo-400 bg-indigo-50/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">ML Space: Principle</p>
              <p className="mt-1 text-sm font-semibold text-indigo-900">{root.economicPrinciple || root.title || root.concept}</p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800">{root.explanation || root.description}</p>
            </div>
          )}

          {caseStudy && (
            <div className="rounded-md border-l-4 border-slate-400 bg-slate-100/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Historical Case</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-800 font-medium">{caseStudy.market || "Comparable scenario"}</p>
              <p className="mt-1 text-xs italic leading-relaxed text-slate-800">"{caseStudy.outcome}"</p>
            </div>
          )}
        </div>
      </div>

      {analytics?.caveat && (
        <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3">
          <p className="text-xs leading-relaxed text-indigo-900">
            <span className="font-bold">Accuracy Guard:</span> {analytics.caveat}
          </p>
        </div>
      )}
    </div>
  );
}


function ActionPlanCard({ actionPlan }) {
  if (!actionPlan) return null;

  const items = [
    { icon: Target, label: "Action", value: actionPlan.recommendedAction },
    { icon: ClipboardCheck, label: "Why", value: actionPlan.why },
    { icon: AlertTriangle, label: "Risk", value: actionPlan.risk },
    { icon: Zap, label: "Test", value: actionPlan.whatToTest },
    { icon: BarChart3, label: "Metric", value: actionPlan.metricToWatch },
    { icon: CalendarCheck, label: "Review", value: actionPlan.reviewDate }
  ].filter((item) => item.value);

  return (
    <div className="mt-3 rounded-md border border-indigo-100 bg-indigo-50/60 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Action Plan</p>
        <span className="w-fit rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
          {actionPlan.confidence || "medium"} confidence
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div className="rounded-md border border-indigo-100 bg-white p-3" key={label}>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              <Icon size={12} />
              {label}
            </div>
            <p className="text-sm leading-relaxed text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      {actionPlan.missingData?.length > 0 && (
        <p className="mt-2 text-xs text-amber-700">
          Confidence limitation: missing {actionPlan.missingData.join(", ")}.
        </p>
      )}
    </div>
  );
}

function DecisionCard({ decision, currency }) {

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{decision.product}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(decision.createdAt || Date.now()).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-semibold ${severityStyles(decision.advice?.severity)}`}>
            {decision.advice?.title || "Decision captured"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {labelValue("Old price", optionalCurrency(decision.oldPrice, currency))}
        {labelValue("New price", optionalCurrency(decision.newPrice ?? decision.currentPrice, currency))}
        {labelValue("Cost", optionalCurrency(decision.cost, currency))}
        {labelValue("Competitor price", optionalCurrency(decision.competitorPrice, currency))}
        {labelValue("Price move", displayPriceMove(decision.priceChangeType))}
        {labelValue("Demand", decision.demandChange)}
        {labelValue("Goal", decision.goal)}
      </div>

      <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        <p className="font-medium text-slate-900">{decision.advice?.recommendation}</p>
        <p className="mt-1">{decision.advice?.rationale}</p>
        <ActionPlanCard actionPlan={decision.advice?.actionPlan} />
        {decision.advice?.aiJustification && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <BotMessageSquare size={12} />
              Mentor note
            </p>
            <p className="text-sm italic leading-relaxed text-slate-700">"{decision.advice.aiJustification}"</p>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">Next step: {decision.advice?.nextStep}</p>
      </div>

      <DecisionInsights currency={currency} decision={decision} />

      <p className="mt-3 text-xs text-slate-500">Original message: "{decision.rawMessage}"</p>
    </article>
  );
}

export function PricingAssistantPanel({
  assistantDecisions,
  assistantInput,
  assistantState,
  chatHistory,
  currency,
  draftDecision,
  handleAssistantSubmit,
  handleConfirmDecision,
  handleResetAssistant,
  handleSnoozeFeedback,
  latestAssistantDecision,
  refreshAssistantHistory,
  setAssistantInput,
  unresolvedDecision
}) {
  const isRunning = assistantState === "running";

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
      <div className="lg:col-span-7">
        <WorkspacePanel>
          <SectionHeader
            action={
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={handleResetAssistant}
                  type="button"
                >
                  New Chat
                </button>
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={refreshAssistantHistory}
                  type="button"
                >
                  <History size={15} />
                  Refresh
                </button>
              </div>
            }
            description="Capture small-business pricing decisions in natural language and convert them into structured decision history."
            icon={BotMessageSquare}
            title="Pricing Assistant"
          />

          <div className="mt-4 flex h-[600px] flex-col rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {chatHistory?.map((msg, index) => (
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} key={index}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                      ? "rounded-br-sm bg-slate-900 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    {msg.text}
                    {msg.meta && (
                      <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-slate-300" : "text-slate-500"}`}>
                        {msg.meta}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {draftDecision && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900 shadow-sm">
                    <p className="mb-3 text-sm italic">"{draftDecision.conversationalResponse}"</p>
                    <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2">
                      {labelValue("Product", draftDecision.product)}
                      {labelValue("Price move", displayPriceMove(draftDecision.priceChangeType))}
                      {labelValue("Old price", draftDecision.oldPrice !== null && draftDecision.oldPrice !== undefined ? optionalCurrency(draftDecision.oldPrice, currency) : "Missing")}
                      {labelValue("New price", draftDecision.newPrice !== null && draftDecision.newPrice !== undefined ? optionalCurrency(draftDecision.newPrice, currency) : "Missing")}
                      {labelValue("Cost", draftDecision.cost !== null && draftDecision.cost !== undefined ? optionalCurrency(draftDecision.cost, currency) : "Missing")}
                      {labelValue("Competitor price", optionalCurrency(draftDecision.competitorPrice, currency))}
                      {labelValue("Demand", draftDecision.demandChange)}
                      {labelValue("Goal", draftDecision.goal || "Missing")}
                      {labelValue("Confidence", `${draftDecision.extractionConfidence || 0}%`)}
                    </div>
                    {draftDecision.context?.stage === "ready_to_save" && (
                      <ActionPlanCard actionPlan={draftDecision.advice?.actionPlan} />
                    )}
                    {draftDecision.missingFields?.length > 0 && (
                      <p className="mb-3 text-xs text-amber-700">
                        Missing: {draftDecision.missingFields.join(", ")}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {draftDecision.context?.stage === "ready_to_save" ? (
                        <button
                          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                          onClick={() => handleConfirmDecision(true)}
                          type="button"
                        >
                          Yes, save it
                        </button>
                      ) : (
                        <button
                          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                          onClick={() => handleConfirmDecision(true)}
                          type="button"
                        >
                          Yes, continue
                        </button>
                      )}
                      <button
                        className="rounded-md border border-indigo-200 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                        onClick={() => handleConfirmDecision(false)}
                        type="button"
                      >
                        No, I'll retype
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isRunning && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-500 shadow-sm">
                    <span className="flex h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "0ms" }} />
                    <span className="flex h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "150ms" }} />
                    <span className="flex h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-b-lg border-t border-slate-200 bg-white p-3">
              {unresolvedDecision && (
                <div className="mb-2 flex justify-end px-1">
                  <button
                    className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    onClick={handleSnoozeFeedback}
                    type="button"
                  >
                    I'll answer this later
                  </button>
                </div>
              )}
              <form className="flex gap-2" onSubmit={handleAssistantSubmit}>
                <input
                  className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  disabled={isRunning || !!draftDecision}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  placeholder={draftDecision ? "Please confirm above..." : "Type your pricing decision..."}
                  type="text"
                  value={assistantInput}
                />
                <button
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400"
                  disabled={isRunning || !!draftDecision || !assistantInput.trim()}
                  type="submit"
                >
                  <Send size={16} className={assistantInput.trim() && !draftDecision ? "translate-x-0.5" : ""} />
                </button>
              </form>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      <div className="mt-6 space-y-6 lg:col-span-5 lg:mt-0">
        {/* Unified Sidebar */}
        <WorkspacePanel className="flex flex-col gap-6">
          {latestAssistantDecision && (
            <div className="space-y-4">
              <SectionHeader description="Immediate mentor support and action plan." icon={ShieldCheck} title="Latest Advice" />
              <DecisionCard currency={currency} decision={latestAssistantDecision} />
              {latestAssistantDecision.missingFields?.length > 0 && (
                <WarningPanel
                  title="Improve this decision row"
                  warnings={[`Missing or unclear: ${latestAssistantDecision.missingFields.join(", ")}.`]}
                />
              )}
            </div>
          )}

          <div className="grid gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Stats</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SummaryCard icon={History} label="Captured" note="Decision history count" value={formatNumber(assistantDecisions.length)} />
              <SummaryCard icon={ShieldCheck} label="Current Method" note="Mentor-led analysis" value="Active" />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <SectionHeader description="Previously captured decisions for reference." icon={History} title="History" />
            <div className="grid max-h-[30rem] gap-3 overflow-auto pr-1">
              {!assistantDecisions.length && (
                <EmptyState
                  message="Capture decisions to build shop memory."
                  title="No history yet"
                />
              )}
              {assistantDecisions.map((decision) => (
                <DecisionCard currency={currency} decision={decision} key={decision._id} />
              ))}
            </div>
          </div>
        </WorkspacePanel>
      </div>
    </div>

  );
}
