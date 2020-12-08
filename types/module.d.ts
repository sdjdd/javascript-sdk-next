export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (env: Env) => void;
  after?: string;
}

export interface Env {
  modules: Record<string, Module>;
}
