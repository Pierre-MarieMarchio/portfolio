import { FactsSource, ProjectSource } from './project.model';
import { DetailSource } from './project-detail.model';

export interface ProjectCatalog {
  readonly projects: readonly ProjectSource[];
  readonly facts: Readonly<Record<string, FactsSource>>;
  readonly details: Readonly<Record<string, DetailSource>>;
}
