export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (env: any) => void;
}
