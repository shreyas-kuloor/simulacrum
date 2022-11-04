import path from 'path';
import vm from 'vm';
import fs from 'fs';
import { assert } from 'assert-ts';
import { parseRulesFiles } from './parse-rules-files';
import type { RuleContext, RuleUser } from './types';

export type RulesRunner = <A, I>(user: RuleUser, context: RuleContext<A, I>) => void;

export function createRulesRunner(rulesPath?: string): RulesRunner {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let callback = (_user: RuleUser, _context: RuleContext<unknown, unknown>) => { };

  if (typeof rulesPath === 'undefined') {
    return callback;
  }

  let fullPath = path.join(process.cwd(), rulesPath);

  assert(fs.existsSync(fullPath), `no rules directory at ${fullPath}`);

  let rules = parseRulesFiles(rulesPath);

  if (rules.length === 0) {
    return callback;
  }

  return async <A, I>(user: RuleUser, context: RuleContext<A, I>) => {
    console.debug(`applying ${rules.length} rules`);

    let sandbox = {
        process,
        Buffer,
        clearImmediate,
        clearInterval,
        clearTimeout,
        setImmediate,
        setInterval,
        setTimeout,
        console,
        require,
        module,
        __simulator: {
          ...{
            user,
            context: { ...context },
          },
        },
    };

      for (let rule of rules) {
      await new Promise((resolve) => {
        let vmContext = vm.createContext({ ...sandbox, resolve });
        assert(typeof rule !== 'undefined', 'undefined rule');

        let { code, filename } = rule;

        console.debug(`executing rule ${path.basename(filename)}`);

        let script = new vm.Script(`
          (async function(exports) {
            try {
              await (${code})(__simulator.user, __simulator.context, resolve);
            } catch (err) {
              console.error(err);
            resolve();
            }
          })(module.exports)
        `);

        script.runInContext(vmContext, {
          filename,
          displayErrors: true,
        });
      }).catch((error) => console.error(error));
      }
  };
}
