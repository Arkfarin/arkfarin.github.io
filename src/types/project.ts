export interface ProjectAsset {
  src: string;
  width?: number;
  height?: number;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  background?: string;
  category?: string;
  technologies: string[];
  repository: string;
  branch: string;
  readme_blob_sha: string;
  language?: string;
  assets?: Partial<Record<string, ProjectAsset>>;
}
