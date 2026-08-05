import fs from 'fs';
import path from 'path';

export interface ResourceCostItem {
  timestamp: number;
  jobId?: string;
  resourceType: 'CLOUD_RUN_CPU' | 'CLOUD_RUN_MEM' | 'ANALYSIS_API' | 'GPU_COMPUTE' | 'STORAGE';
  description: string;
  costUsd: number;
}

export interface BudgetLimits {
  dailyLimitUsd: number;
  weeklyLimitUsd: number;
  monthlyLimitUsd: number;
}

export interface CostSummary {
  dailySpentUsd: number;
  dailyRemainingUsd: number;
  weeklySpentUsd: number;
  weeklyRemainingUsd: number;
  monthlySpentUsd: number;
  limits: BudgetLimits;
  items: ResourceCostItem[];
}

export class GcpCostMonitorManager {
  private items: ResourceCostItem[] = [];
  private limits: BudgetLimits = {
    dailyLimitUsd: 10.0, // $10/day default limit
    weeklyLimitUsd: 50.0, // $50/week default limit
    monthlyLimitUsd: 150.0, // $150/month default limit
  };
  private dataFile: string;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'uploads', 'cost_monitor_db.json');
    this.loadState();
  }

  private loadState() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.items) this.items = parsed.items;
        if (parsed.limits) this.limits = { ...this.limits, ...parsed.limits };
      }
    } catch (_) {}
  }

  private saveState() {
    try {
      fs.writeFileSync(
        this.dataFile,
        JSON.stringify({ items: this.items, limits: this.limits }, null, 2)
      );
    } catch (_) {}
  }

  /**
   * Record credit/cost deduction for GCP usage
   */
  public recordUsage(
    resourceType: ResourceCostItem['resourceType'],
    description: string,
    costUsd: number,
    jobId?: string
  ): ResourceCostItem {
    const item: ResourceCostItem = {
      timestamp: Date.now(),
      jobId,
      resourceType,
      description,
      costUsd: parseFloat(costUsd.toFixed(4)),
    };

    this.items.unshift(item);
    // Keep max 500 records
    if (this.items.length > 500) {
      this.items = this.items.slice(0, 500);
    }

    this.saveState();
    return item;
  }

  /**
   * Automatically calculate cost for a 3D Gaussian Splatting job
   */
  public recordJobCost(jobId: string, photoCount: number, iterations: number = 30000) {
    // Cloud Run CPU: 2 vCPU * 120s * $0.000024 = $0.00576
    const cpuCost = 2 * 120 * 0.000024;
    this.recordUsage('CLOUD_RUN_CPU', `Cloud Run 2 vCPU execution for job ${jobId}`, cpuCost, jobId);

    // Cloud Run Memory: 4 GB * 120s * $0.0000025 = $0.0012
    const memCost = 4 * 120 * 0.0000025;
    this.recordUsage('CLOUD_RUN_MEM', `Cloud Run 4GB RAM allocation for job ${jobId}`, memCost, jobId);

    // GPU Compute Splatting Training: $0.045 per 30k iteration run
    const gpuCost = (iterations / 30000) * 0.045 + photoCount * 0.0005;
    this.recordUsage('GPU_COMPUTE', `3D GS Training (${iterations} iters, ${photoCount} views)`, gpuCost, jobId);
  }

  /**
   * Get summary of daily, weekly, and monthly cost and remaining credits
   */
  public getSummary(): CostSummary {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let dailySpent = 0;
    let weeklySpent = 0;
    let monthlySpent = 0;

    this.items.forEach((item) => {
      if (item.timestamp >= oneDayAgo) dailySpent += item.costUsd;
      if (item.timestamp >= oneWeekAgo) weeklySpent += item.costUsd;
      if (item.timestamp >= oneMonthAgo) monthlySpent += item.costUsd;
    });

    dailySpent = parseFloat(dailySpent.toFixed(4));
    weeklySpent = parseFloat(weeklySpent.toFixed(4));
    monthlySpent = parseFloat(monthlySpent.toFixed(4));

    return {
      dailySpentUsd: dailySpent,
      dailyRemainingUsd: parseFloat(Math.max(0, this.limits.dailyLimitUsd - dailySpent).toFixed(4)),
      weeklySpentUsd: weeklySpent,
      weeklyRemainingUsd: parseFloat(Math.max(0, this.limits.weeklyLimitUsd - weeklySpent).toFixed(4)),
      monthlySpentUsd: monthlySpent,
      limits: this.limits,
      items: this.items,
    };
  }

  public updateLimits(limits: Partial<BudgetLimits>): BudgetLimits {
    this.limits = { ...this.limits, ...limits };
    this.saveState();
    return this.limits;
  }
}
