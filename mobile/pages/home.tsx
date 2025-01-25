/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import {prepareSrs} from '../lib/noir';
import Input from '../components/Input';
import {generateProof, setupCircuit} from '../lib/noir';
import {Circuit} from '../types';
import circuit from '../circuits/zkemail_header/zkemail_test.json';
import {ZKEMAIL_INPUTS} from '../utils/inputs';

export default function Home() {
  const [avgProvingTime, setAvgProvingTime] = useState<number>(0);
  const [circuitId, setCircuitId] = useState<string>('');
  const [iterations, setIterations] = useState<string>('');
  const [proving, setProving] = useState<number>(-1);

  const handleInput = (text: string) => {
    if (proving > -1) return;
    // force minimum of 1 iteration
    if (text === '0') {
      setIterations('1');
    } else {
      // Use a regular expression to allow only numbers
      const numericValue = text.replace(/[^0-9]/g, '');
      setIterations(numericValue);
    }
  };

  const proveHonk = async () => {
    setAvgProvingTime(0);
    setProving(0);
    const numIter = Number(iterations);
    let totalTime = 0;
    for (let i = 0; i < numIter; i++) {
      setProving(i + 1);
      const start = new Date().getTime() / 1000;
      await generateProof(ZKEMAIL_INPUTS, circuitId!);
      const end = new Date().getTime() / 1000;
      totalTime += end - start;
    }
    const avgTime = totalTime / numIter;
    setAvgProvingTime(avgTime);
    setProving(-1);
  };

  useEffect(() => {
    setupCircuit(circuit as unknown as Circuit).then(id => setCircuitId(id));
    // Load the local SRS (if present in resources) in internal storage
    // Only for Android, will be skipped on iOS
    prepareSrs();
  }, []);

  return (
    <MainLayout>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          marginBottom: 20,
          textAlign: 'center',
          color: '#6B7280',
        }}></Text>
      <View
        style={{
          gap: 20,
        }}>
        <Input
          onChangeText={handleInput}
          placeholder="# of iterations"
          placeholderTextColor="gray"
          value={iterations}
        />
        <Button
          disabled={proving > -1}
          onPress={() => {
            proveHonk();
          }}>
          <Text
            style={{
              color: 'white',
              fontWeight: '700',
            }}>
            {proving > -1
              ? `Proving Honk for ${proving} of ${iterations} iterations`
              : 'Prove Honk'}
          </Text>
        </Button>

        {avgProvingTime > 0 && (
          <Text
            style={{
              color: 'black',
              fontWeight: '700',
              marginTop: 40,
              textAlign: 'center',
            }}>
            Average proving time: {avgProvingTime.toFixed(4)} seconds
          </Text>
        )}
      </View>
    </MainLayout>
  );
}
