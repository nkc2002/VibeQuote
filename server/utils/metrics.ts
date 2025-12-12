/**
 * Prometheus-Compatible Metrics for VibeQuote
 *
 * Emits metrics in Prometheus format to logs.
 * Can be scraped by Prometheus or parsed from logs.
 */

interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface MetricDefinition {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram";
  values: MetricValue[];
}

class MetricsRegistry {
  private metrics: Map<string, MetricDefinition> = new Map();
  private histogramBuckets = [0.1, 0.5, 1, 2.5, 5, 10, 30, 60];

  // Counter: jobs_succeeded_total
  incJobsSucceeded(labels?: Record<string, string>): void {
    this.increment("vibequote_jobs_succeeded_total", {
      help: "Total number of successful video generation jobs",
      type: "counter",
      labels,
    });
  }

  // Counter: jobs_failed_total
  incJobsFailed(reason: string, labels?: Record<string, string>): void {
    this.increment("vibequote_jobs_failed_total", {
      help: "Total number of failed video generation jobs",
      type: "counter",
      labels: { ...labels, reason },
    });
  }

  // Histogram: encode_time_seconds
  observeEncodeTime(seconds: number, labels?: Record<string, string>): void {
    this.observe("vibequote_encode_time_seconds", seconds, {
      help: "Video encoding time in seconds",
      type: "histogram",
      labels,
    });
  }

  // Gauge: queue_size
  setQueueSize(running: number, queued: number): void {
    this.setGauge("vibequote_queue_running", running, {
      help: "Number of running video generation jobs",
    });
    this.setGauge("vibequote_queue_waiting", queued, {
      help: "Number of queued video generation jobs",
    });
  }

  // Gauge: tmp_usage_bytes
  setTmpUsage(bytes: number): void {
    this.setGauge("vibequote_tmp_usage_bytes", bytes, {
      help: "Current /tmp directory usage in bytes",
    });
  }

  private increment(
    name: string,
    opts: { help: string; type: "counter"; labels?: Record<string, string> }
  ): void {
    let metric = this.metrics.get(name);

    if (!metric) {
      metric = { name, help: opts.help, type: opts.type, values: [] };
      this.metrics.set(name, metric);
    }

    const labelKey = JSON.stringify(opts.labels || {});
    const existing = metric.values.find(
      (v) => JSON.stringify(v.labels || {}) === labelKey
    );

    if (existing) {
      existing.value++;
      existing.timestamp = Date.now();
    } else {
      metric.values.push({
        value: 1,
        timestamp: Date.now(),
        labels: opts.labels,
      });
    }

    this.logMetric(name, opts.labels);
  }

  private setGauge(
    name: string,
    value: number,
    opts: { help: string; labels?: Record<string, string> }
  ): void {
    let metric = this.metrics.get(name);

    if (!metric) {
      metric = { name, help: opts.help, type: "gauge", values: [] };
      this.metrics.set(name, metric);
    }

    const labelKey = JSON.stringify(opts.labels || {});
    const existing = metric.values.find(
      (v) => JSON.stringify(v.labels || {}) === labelKey
    );

    if (existing) {
      existing.value = value;
      existing.timestamp = Date.now();
    } else {
      metric.values.push({
        value,
        timestamp: Date.now(),
        labels: opts.labels,
      });
    }
  }

  private observe(
    name: string,
    value: number,
    opts: { help: string; type: "histogram"; labels?: Record<string, string> }
  ): void {
    // Log for parsing
    this.logMetric(name, { ...opts.labels, value: value.toString() });

    // Also track sum and count
    const sumName = `${name}_sum`;
    const countName = `${name}_count`;

    let sumMetric = this.metrics.get(sumName);
    if (!sumMetric) {
      sumMetric = {
        name: sumName,
        help: `${opts.help} (sum)`,
        type: "counter",
        values: [],
      };
      this.metrics.set(sumName, sumMetric);
    }

    let countMetric = this.metrics.get(countName);
    if (!countMetric) {
      countMetric = {
        name: countName,
        help: `${opts.help} (count)`,
        type: "counter",
        values: [],
      };
      this.metrics.set(countName, countMetric);
    }

    // Update sum and count
    const labelKey = JSON.stringify(opts.labels || {});

    const existingSum = sumMetric.values.find(
      (v) => JSON.stringify(v.labels || {}) === labelKey
    );
    if (existingSum) {
      existingSum.value += value;
    } else {
      sumMetric.values.push({
        value,
        timestamp: Date.now(),
        labels: opts.labels,
      });
    }

    const existingCount = countMetric.values.find(
      (v) => JSON.stringify(v.labels || {}) === labelKey
    );
    if (existingCount) {
      existingCount.value++;
    } else {
      countMetric.values.push({
        value: 1,
        timestamp: Date.now(),
        labels: opts.labels,
      });
    }
  }

  private logMetric(name: string, labels?: Record<string, string>): void {
    const labelStr = labels
      ? Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(",")
      : "";

    console.log(`[METRIC] ${name}{${labelStr}}`);
  }

  // Export in Prometheus format
  toPrometheusFormat(): string {
    const lines: string[] = [];

    for (const [name, metric] of this.metrics) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);

      for (const v of metric.values) {
        const labelStr = v.labels
          ? `{${Object.entries(v.labels)
              .map(([k, val]) => `${k}="${val}"`)
              .join(",")}}`
          : "";
        lines.push(`${name}${labelStr} ${v.value}`);
      }
    }

    return lines.join("\n");
  }

  // Get current stats for monitoring
  getStats(): {
    jobsSucceeded: number;
    jobsFailed: number;
    avgEncodeTime: number;
    errorRate: number;
  } {
    const succeeded = this.getMetricTotal("vibequote_jobs_succeeded_total");
    const failed = this.getMetricTotal("vibequote_jobs_failed_total");
    const total = succeeded + failed;

    const encodeSum = this.getMetricTotal("vibequote_encode_time_seconds_sum");
    const encodeCount = this.getMetricTotal(
      "vibequote_encode_time_seconds_count"
    );

    return {
      jobsSucceeded: succeeded,
      jobsFailed: failed,
      avgEncodeTime: encodeCount > 0 ? encodeSum / encodeCount : 0,
      errorRate: total > 0 ? failed / total : 0,
    };
  }

  private getMetricTotal(name: string): number {
    const metric = this.metrics.get(name);
    if (!metric) return 0;
    return metric.values.reduce((sum, v) => sum + v.value, 0);
  }
}

// Singleton instance
export const metrics = new MetricsRegistry();

// Express middleware to expose /metrics endpoint
export function metricsEndpoint(req: any, res: any): void {
  res.set("Content-Type", "text/plain");
  res.send(metrics.toPrometheusFormat());
}

export default metrics;
