import { PipelineJob, LogMessage } from '../types';

export interface PipelineSocketListeners {
  onJobCreated?: (job: PipelineJob) => void;
  onJobProgress?: (job: PipelineJob) => void;
  onJobLog?: (jobId: string, log: LogMessage) => void;
  onJobStatusChange?: (job: PipelineJob) => void;
  onJobCompleted?: (job: PipelineJob) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class PipelineSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: PipelineSocketListeners = {};
  private reconnectTimer: any = null;
  public isConnected = false;

  constructor(serverUrl?: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const defaultWsUrl = `${protocol}//${host}/ws`;
    this.url = serverUrl || defaultWsUrl;
  }

  public connect(listeners: PipelineSocketListeners = {}) {
    this.listeners = listeners;

    try {
      const targetUrl = window.location.port === '5173' ? 'ws://localhost:3000/ws' : this.url;
      this.ws = new WebSocket(targetUrl);

      this.ws.onopen = () => {
        console.log('[PipelineSocket] Connected to 3D Gaussian Splatting Telemetry Stream');
        this.isConnected = true;
        if (this.listeners.onConnect) this.listeners.onConnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[PipelineSocket] Error parsing event:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.listeners.onDisconnect) this.listeners.onDisconnect();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[PipelineSocket] Error:', err);
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.listeners);
    }, 3000);
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'JOB_CREATED':
        if (this.listeners.onJobCreated) this.listeners.onJobCreated(data.job);
        break;
      case 'JOB_PROGRESS':
        if (this.listeners.onJobProgress) this.listeners.onJobProgress(data.job);
        break;
      case 'JOB_LOG':
        if (this.listeners.onJobLog) this.listeners.onJobLog(data.jobId, data.log);
        break;
      case 'JOB_STATUS_CHANGE':
        if (this.listeners.onJobStatusChange) this.listeners.onJobStatusChange(data.job);
        break;
      case 'JOB_COMPLETED':
        if (this.listeners.onJobCompleted) this.listeners.onJobCompleted(data.job);
        break;
    }
  }

  public startJob(datasetId: string, datasetName: string, photoCount: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'START_JOB', datasetId, datasetName, photoCount }));
    }
  }

  public cancelJob(jobId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CANCEL_JOB', jobId }));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
