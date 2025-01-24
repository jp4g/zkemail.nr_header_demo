import { compile, createFileManager } from '@noir-lang/noir_wasm';
import main from './circuit/src/main.nr?url';
import nargoToml from './circuit/Nargo.toml?url';

export async function getCircuit() {
  const fm = createFileManager('/');
  const { body } = await fetch(main);
  const { body: nargoTomlBody } = await fetch(nargoToml);

  fm.writeFile('./src/main.nr', body);
  fm.writeFile('./Nargo.toml', nargoTomlBody);
  return await compile(fm);
}
