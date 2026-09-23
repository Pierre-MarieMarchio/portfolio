import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { ProjectsManager } from '@app/features/projects/states';

/**
 * A sheet's tab is named after its project. The route can only say
 * "Projet"; resolved here, the name reaches the title strategy like any
 * route title, and the head keeps a single writer.
 *
 * The catalogue is loaded by the app initializer, before the first
 * navigation, so the project is known by the time this runs. An unknown slug
 * keeps the route's word: the station shows it the unknown address.
 */
export const projectTitle: ResolveFn<string> = (route) =>
  inject(ProjectsManager).find(route.paramMap.get('slug') ?? '')?.title ??
  'Projet';
