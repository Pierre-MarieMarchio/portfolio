import { Resolved, Text } from '@app/core/rules';
import { DetailSource } from './project-detail.model';
import { ProjectFamily } from './project-family.model';

export interface ProjectSource {
  readonly slug: string;
  readonly title: Text;
  readonly short: Text;
  readonly tag: Text;
  readonly family: ProjectFamily;
  readonly subject: Text;
  readonly summary: Text;
}

export interface FactsSource {
  readonly proof: Text;
  readonly role: Text;
  readonly stack: Text;
  readonly context: Text;
  readonly period: Text;
}

export interface ProjectEntry {
  readonly project: ProjectSource;
  readonly facts: FactsSource;
  readonly detail: DetailSource;
}

export type Project = Resolved<ProjectSource>;

type ProjectFacts = Resolved<FactsSource>;

export interface Ranking {
  readonly rank: number;
  readonly number: string;
  readonly featured: boolean;
}

export interface RankedProject extends Project, Ranking {
  readonly facts: ProjectFacts;
}
