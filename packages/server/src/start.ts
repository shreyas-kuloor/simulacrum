import { spawnSimulationServer } from './server';
import { main } from '@effection/node';
import { HttpHandler, Server } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const echo: HttpHandler = (_request, _response) => Promise.resolve();

main(function* (scope) {
  let { port }: Server = yield spawnSimulationServer(scope, {
    simulators: {
      echo(simulation) {
        return simulation.http(app => app.get('/', echo));
      },
    }
  });

  console.log(`Simulation server running on http://localhost:${port}/graphql`);

  yield;
});
