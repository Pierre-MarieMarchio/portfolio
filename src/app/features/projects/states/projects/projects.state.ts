import { Service, signal } from '@angular/core';
import { DetailSource, FactsSource, ProjectSource } from '../../models';

@Service()
export class ProjectsState {
  public readonly projects = signal<readonly ProjectSource[]>([]);
  public readonly facts = signal<Readonly<Record<string, FactsSource>>>({});
  public readonly details = signal<Readonly<Record<string, DetailSource>>>({});
  public readonly isLoading = signal(false);
  public readonly isError = signal(false);
}
