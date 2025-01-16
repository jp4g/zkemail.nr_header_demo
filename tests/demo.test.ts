import fs from "fs";
import path from "path";
import { ZKEmailProver } from "@zk-email/zkemail-nr/dist/prover";
import {
  CircuitInput,
  generateEmailVerifierInputsFromDKIMResult,
  verifyDKIMSignature,
} from "@zk-email/zkemail-nr";
import circuit from "../target/zkemail_test.json";
import { Sequence } from "@zk-email/zkemail-nr/dist/utils";

const email = fs.readFileSync(path.join(__dirname, "../email.eml"));

// default header/ body lengths to use for input gen
const inputParams = {
  maxHeadersLength: 576,
  extractFrom: true,
};

type CustomCircuitInputs = CircuitInput & {
  date_index: string;
  subject_sequence: Sequence;
};

type BoundedVec = {
  len: string;
  storage: Array<string>;
};

describe("ZKEmail.nr Circuit Unit Tests", () => {
  let prover: ZKEmailProver;
  let inputs: CustomCircuitInputs;

  beforeAll(async () => {
    // set up base inputs
    // base zkemail input gen
    const dkimResult = await verifyDKIMSignature(email);
    const baseInputs = await generateEmailVerifierInputsFromDKIMResult(
      dkimResult,
      inputParams
    );

    // determine date sequence
    const header = dkimResult.headers.toString();
    const dateField = /[Dd]ate:.*\r?\n/.exec(header);
    const subjectField = /[Ss]ubject:.*\r?\n/.exec(header);

    inputs = {
      subject_sequence: {
        index: String(subjectField!.index),
        length: String(subjectField![0].length),
      },
      date_index: String(dateField!.index),
      ...baseInputs,
    };
  });

  describe("Simulated", () => {
    beforeAll(() => {
      //@ts-ignore
      prover = new ZKEmailProver(circuit, 'honk');
    });
    afterAll(async () => {
      await prover.destroy();
    });
    it("Simulate Witness/ Check Outputs", async () => {
      // simulate witness
      const result = await prover.simulateWitness(inputs);

      // check sender address
      const sender = result.returnValue[1] as BoundedVec;
      const expectedSenderLength = 23;
      const expectedSender = "gilcrest.jack@gmail.com";

      expect(Number(sender.len)).toEqual(expectedSenderLength);
      const empiricalSender = sender.storage
        .slice(0, expectedSenderLength)
        .map((hex) => String.fromCharCode(parseInt(hex, 16)))
        .join("");
      expect(empiricalSender).toEqual(expectedSender);

      // check date time
      const dateTime = result.returnValue[2] as BoundedVec;
      const expectedDateTimeLength = 31;
      const expectedDateTime = "Tue, 14 Jan 2025 23:00:42 -0700";

      expect(Number(dateTime.len)).toEqual(expectedDateTimeLength);
      const empiricalDateTime = dateTime.storage
        .slice(0, expectedDateTimeLength)
        .map((hex) => String.fromCharCode(parseInt(hex, 16)))
        .join("");
      expect(empiricalDateTime).toEqual(expectedDateTime);

      // check subject
      const subject = result.returnValue[3] as BoundedVec;
      const expectedSubjectLength = 20;
      const expectedSubject = "This is a test email";

      expect(Number(subject.len)).toEqual(expectedSubjectLength);
      const empiricalSubject = subject.storage
        .slice(0, expectedSubjectLength)
        .map((hex) => String.fromCharCode(parseInt(hex, 16)))
        .join("");
      expect(empiricalSubject).toEqual(expectedSubject);

      // log the outputs just to show
      // omits email nullifier and pubkey hash
      const output =
        "===============[Outputs]================" +
        `\nSender: "${empiricalSender}"` +
        `\nDatetime: "${empiricalDateTime}"` +
        `\nSubject: "${empiricalSubject}"`;
      console.log(output);
    });
  });

  describe("Plonk Proving", () => {
    beforeAll(() => {
      //@ts-ignore
      prover = new ZKEmailProver(circuit, 'plonk');
    });
    afterAll(async () => {
      await prover.destroy();
    });
    it("Iteration 1", async () => {
      const start = Date.now();
      const proof = await prover.fullProve(inputs, "plonk");
      const proofGenTime = Date.now() - start;
      const result = await prover.verify(proof, "plonk");
      const verifyTime = Date.now() - start - proofGenTime;
      expect(result).toBeTruthy();
      const output =
        "===============[Plonk Cold Proof Stats]================" +
        `\nProof Generation Time: ${proofGenTime}ms` +
        `\nVerify Time: ${verifyTime}ms`;
      console.log(output);
    });
    it("Iteration 2", async () => {
      const start = Date.now();
      const proof = await prover.fullProve(inputs, "plonk");
      const proofGenTime = Date.now() - start;
      const result = await prover.verify(proof, "plonk");
      const verifyTime = Date.now() - start - proofGenTime;
      expect(result).toBeTruthy();
      const output =
        "===============[Plonk Warm Proof Stats]================" +
        `\nProof Generation Time: ${proofGenTime}ms` +
        `\nVerify Time: ${verifyTime}ms`;
      console.log(output);
    });
  });

  describe("Honk Proving", () => {
    beforeAll(() => {
      //@ts-ignore
      prover = new ZKEmailProver(circuit, 'honk');
    });
    afterAll(async () => {
      await prover.destroy();
    });
    it("Iteration 1", async () => {
      const start = Date.now();
      const proof = await prover.fullProve(inputs, "honk");
      const proofGenTime = Date.now() - start;
      const result = await prover.verify(proof, "honk");
      const verifyTime = Date.now() - start - proofGenTime;
      expect(result).toBeTruthy();
      const output =
        "===============[Honk Cold Proof Stats]================" +
        `\nProof Generation Time: ${proofGenTime}ms` +
        `\nVerify Time: ${verifyTime}ms`;
      console.log(output);
    });
    it("Iteration 2", async () => {
      const start = Date.now();
      const proof = await prover.fullProve(inputs, "honk");
      const proofGenTime = Date.now() - start;
      const result = await prover.verify(proof, "honk");
      const verifyTime = Date.now() - start - proofGenTime;
      expect(result).toBeTruthy();
      const output =
        "===============[Honk Warm Proof Stats]================" +
        `\nProof Generation Time: ${proofGenTime}ms` +
        `\nVerify Time: ${verifyTime}ms`;
      console.log(output);
    });
  });
});
