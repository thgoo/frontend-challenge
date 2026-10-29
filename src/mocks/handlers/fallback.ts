import { http } from 'msw';
import { apiPath } from '../http/api';
import { apiError } from '../http/responses';

export const unknownEndpointHandler = http.all(apiPath('/*'), () =>
  apiError(404, 'NOT_FOUND', 'Unknown API endpoint.'),
);
