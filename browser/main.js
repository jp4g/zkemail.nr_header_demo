// import circuit from '../circuit/target/circuit.json';
// import emailCircuit from '../circuit/zkemail/target/noir_zkemail_benchmarks.json';
import { Noir } from '@noir-lang/noir_js';
import { getCircuit } from './compile';

const display = (container, msg, elementToRemove) => {
  const c = document.getElementById(container);
  if (elementToRemove) {
    c.removeChild(elementToRemove);
  }
  const p = document.createElement('p');
  p.textContent = msg;
  c.appendChild(p);
  return p;
};

const calcAvg = (aggTime, iterations) => {
  return {
    proofGenerationTime: aggTime.proofGenerationTime / iterations,
    proofVerificationTime: aggTime.proofVerificationTime / iterations,
    totalTime: aggTime.totalTime / iterations,
    witnessGenerationTime: aggTime.witnessGenerationTime / iterations,
  };
};

const prove = async (proveWith) => {
  const circuit = await getCircuit();
  // let backend = undefined;
  // if (proveWith === 'ultrahonk') {
  //   backend = new UltraHonkBackend(emailCircuit);
  // } else {
  //   backend = new BarretenbergBackend(emailCircuit);
  // }
  // const emailCircuitInput = {
  //   body_hash_index: 363,
  //   header: [
  //     102, 114, 111, 109, 58, 114, 117, 110, 110, 105, 101, 114, 46, 108, 101,
  //     97, 103, 117, 101, 115, 46, 48, 106, 64, 105, 99, 108, 111, 117, 100, 46,
  //     99, 111, 109, 13, 10, 99, 111, 110, 116, 101, 110, 116, 45, 116, 121, 112,
  //     101, 58, 116, 101, 120, 116, 47, 112, 108, 97, 105, 110, 59, 32, 99, 104,
  //     97, 114, 115, 101, 116, 61, 117, 115, 45, 97, 115, 99, 105, 105, 13, 10,
  //     109, 105, 109, 101, 45, 118, 101, 114, 115, 105, 111, 110, 58, 49, 46, 48,
  //     32, 40, 77, 97, 99, 32, 79, 83, 32, 88, 32, 77, 97, 105, 108, 32, 49, 54,
  //     46, 48, 32, 92, 40, 51, 55, 51, 49, 46, 53, 48, 48, 46, 50, 51, 49, 92,
  //     41, 41, 13, 10, 115, 117, 98, 106, 101, 99, 116, 58, 72, 101, 108, 108,
  //     111, 13, 10, 109, 101, 115, 115, 97, 103, 101, 45, 105, 100, 58, 60, 56,
  //     70, 56, 49, 57, 68, 51, 50, 45, 66, 54, 65, 67, 45, 52, 56, 57, 68, 45,
  //     57, 55, 55, 70, 45, 52, 51, 56, 66, 66, 67, 52, 67, 65, 66, 50, 55, 64,
  //     109, 101, 46, 99, 111, 109, 62, 13, 10, 100, 97, 116, 101, 58, 83, 97,
  //     116, 44, 32, 50, 54, 32, 65, 117, 103, 32, 50, 48, 50, 51, 32, 49, 50, 58,
  //     50, 53, 58, 50, 50, 32, 43, 48, 52, 48, 48, 13, 10, 116, 111, 58, 122,
  //     107, 101, 119, 116, 101, 115, 116, 64, 103, 109, 97, 105, 108, 46, 99,
  //     111, 109, 13, 10, 100, 107, 105, 109, 45, 115, 105, 103, 110, 97, 116,
  //     117, 114, 101, 58, 118, 61, 49, 59, 32, 97, 61, 114, 115, 97, 45, 115,
  //     104, 97, 50, 53, 54, 59, 32, 99, 61, 114, 101, 108, 97, 120, 101, 100, 47,
  //     114, 101, 108, 97, 120, 101, 100, 59, 32, 100, 61, 105, 99, 108, 111, 117,
  //     100, 46, 99, 111, 109, 59, 32, 115, 61, 49, 97, 49, 104, 97, 105, 59, 32,
  //     116, 61, 49, 54, 57, 51, 48, 51, 56, 51, 51, 55, 59, 32, 98, 104, 61, 55,
  //     120, 81, 77, 68, 117, 111, 86, 86, 85, 52, 109, 48, 87, 48, 87, 82, 86,
  //     83, 114, 86, 88, 77, 101, 71, 83, 73, 65, 83, 115, 110, 117, 99, 75, 57,
  //     100, 74, 115, 114, 99, 43, 118, 85, 61, 59, 32, 104, 61, 102, 114, 111,
  //     109, 58, 67, 111, 110, 116, 101, 110, 116, 45, 84, 121, 112, 101, 58, 77,
  //     105, 109, 101, 45, 86, 101, 114, 115, 105, 111, 110, 58, 83, 117, 98, 106,
  //     101, 99, 116, 58, 77, 101, 115, 115, 97, 103, 101, 45, 73, 100, 58, 68,
  //     97, 116, 101, 58, 116, 111, 59, 32, 98, 61,
  //   ],
  //   body: [
  //     72, 101, 108, 108, 111, 44, 13, 10, 13, 10, 72, 111, 119, 32, 97, 114,
  //     101, 32, 121, 111, 117, 63, 13, 10,
  //   ],
  //   pubkey_modulus_limbs: [
  //     '0xe5cf995b5ef59ce9943d1f4209b6ab',
  //     '0xe0caf03235e91a2db27e9ed214bcc6',
  //     '0xafe1309f87414bd36ed296dacfade2',
  //     '0xbeff3f19046a43adce46c932514988',
  //     '0x324041af8736e87de4358860fff057',
  //     '0xadcc6669dfa346f322717851a8c22a',
  //     '0x8b2a193089e6bf951c553b5a6f71aa',
  //     '0x0a570fe582918c4f731a0002068df2',
  //     '0x39419a433d6bfdd1978356cbca4b60',
  //     '0x550d695a514d38b45c862320a00ea5',
  //     '0x1c56ac1dfbf1beea31e8a613c2a51f',
  //     '0x6a30c9f22d2e5cb6934263d0838809',
  //     '0x0a281f268a44b21a4f77a91a52f960',
  //     '0x5134dc3966c8e91402669a47cc8597',
  //     '0x71590781df114ec072e641cdc5d224',
  //     '0xa1bc0f0937489c806c1944fd029dc9',
  //     '0x911f6e47f84db3b64c3648ebb5a127',
  //     '0xd5',
  //   ],
  //   redc_params_limbs: [
  //     '0xa48a824e4ebc7e0f1059f3ecfa57c4',
  //     '0x05c1db23f3c7d47ad7e7d7cfda5189',
  //     '0x79bb6bbbd8facf011f022fa9051aec',
  //     '0x24faa4cef474bed639362ea71f7a21',
  //     '0x1503aa50b77e24b030841a7d061581',
  //     '0x5bbf4e62805e1860a904c0f66a5fad',
  //     '0x5cbd24b72442d2ce647dd7d0a44368',
  //     '0x074a8839a4460c169dce7138efdaef',
  //     '0x0f06e09e3191b995b08e5b45182f65',
  //     '0x51fad4a89f8369fe10e5d4b6e149a1',
  //     '0xdc778b15982d11ebf7fe23b4e15f10',
  //     '0xa09ff3a4567077510c474e4ac0a21a',
  //     '0xb37e69e5dbb77167b73065e4c5ad6a',
  //     '0xecf4774e22e7fe3a38642186f7ae74',
  //     '0x16e72b5eb4c813a3b37998083aab81',
  //     '0xa48e7050aa8abedce5a45c16985376',
  //     '0xdd3285e53b322b221f7bcf4f8f8ad8',
  //     '0x0132',
  //   ],
  //   padded_recipient_local: [
  //     122, 107, 101, 119, 116, 101, 115, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   ],
  //   recipient_local_length: 8,
  //   signature: {
  //     limbs: [
  //       '0x5779c85587e51cb8de5c29d7fdfeb0',
  //       '0xcd7ea8b6119f76f117ecb5042f8fc0',
  //       '0xeb7ac32b81d5a87bc2046fa0004e27',
  //       '0x62708c43b0c07a8fe8bdc97c479138',
  //       '0xc1e90d184f22a80be4a484a6ebd462',
  //       '0x39f3ff00e47728aaf74802d2d1d07b',
  //       '0x0f39de2cf99bf20dab7b8ae9240acd',
  //       '0xf4875cb76ce2538f255d70476136d6',
  //       '0xde151a5005ca614d6af7dd01e2a083',
  //       '0x6fe12b286f3195cae005fd7d2a1766',
  //       '0xd6e43a3060eccc555f2ee1e2929932',
  //       '0x0d5fa7cc79c794ae80310b491a1b40',
  //       '0x9cff415204cbc05c772ede05903440',
  //       '0xe7190ccff38575ae70dd055cd892d2',
  //       '0xf34bb777c0c842b0e88738eafdf634',
  //       '0x21040437e1e945a201ff58e542be68',
  //       '0x12f254fa4a0fb776ffe8759eb9eefa',
  //       '0x12',
  //     ],
  //   },
  // };
  // const noir = new Noir(emailCircuit);
  // const start = new Date().getTime() / 1000;
  // const { witness } = await noir.execute(emailCircuitInput);
  // const postWitnessGenerationTime = new Date().getTime() / 1000;
  // const proof = await backend.generateProof(witness);
  // const postProofGenerationTime = new Date().getTime() / 1000;
  // // await backend.verifyProof(proof);
  // // const postVerifyTime = new Date().getTime() / 1000;
  // return {
  //   proofGenerationTime: postProofGenerationTime - postWitnessGenerationTime,
  //   proofVerificationTime: 0,
  //   totalTime: postProofGenerationTime - start,
  //   witnessGenerationTime: postWitnessGenerationTime - start,
  // };
};

const proveBackend = async (backend) => {
  const iterations = 20;

  const totalTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };

  // clear logs
  const logs = document.getElementById('logs');
  logs.innerHTML = '';

  let prevDisplay = display(
    'logs',
    `Benching ${backend} for ${iterations} iteration${
      iterations === 1 ? '' : 's'
    }... ⏳\n\n`
  );

  for (let i = 0; i < iterations; i++) {
    updateTotalTime(totalTimeAgg, await prove(backend));
    prevDisplay = display(
      'logs',
      `Benched ${i + 1} iteration${
        i + 1 === 1 ? '' : 's'
      } of ${iterations} for ${backend}... ⏳`,
      prevDisplay
    );
  }

  const avg = calcAvg(totalTimeAgg, iterations);
  display('logs', `Witness generation time: ${avg.witnessGenerationTime}s ✅`);
  display('logs', `Proof generation time: ${avg.proofGenerationTime}s ✅`);
  // display('logs', `Proof verification time: ${avg.proofVerificationTime}s ✅`);
  display('logs', `Total time: ${avg.totalTime}s ✅`);
};

const updateTotalTime = (total, iteration) => {
  total.proofGenerationTime += iteration.proofGenerationTime;
  total.proofVerificationTime += iteration.proofVerificationTime;
  total.totalTime += iteration.totalTime;
  total.witnessGenerationTime += iteration.witnessGenerationTime;
};

document
  .getElementById('proveUltraHonk')
  .addEventListener('click', async () => await proveBackend('ultrahonk'));
document
  .getElementById('proveUltraPlonk')
  .addEventListener('click', async () => await proveBackend('ultraplonk'));
