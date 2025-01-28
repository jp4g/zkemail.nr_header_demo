# ZKEmail.nr Header Extraction Demo

Steps to use:
```console
git clone https://github.com/mach-34/zkemail.nr_header_demo && cd zkemail.nr_header_demo
yarn
yarn compile
yarn test
```

See gates with `yarn gates` - should be `128213 gates`
Run nargo unit test with `nargo test --silence-warnings --show-output`

Requires `nargo -V` outputs `version 1.0.0-beta.1` (see [noirup](https://github.com/noir-lang/noirup), just run `noirup -v 1.0.0-beta.1`)

## Instructions for running benchmarks in browser

1. Navigate to "browser" directory
```
cd /browser
```

2. Install dependencies
```
yarn 
```

3. Run Vite app
```
yarn dev
```

4. Adjust # of iterations and toggle concurrency on/off

## Instructions for running mobile benchmarks (Android)
### !!!Note we have only done this on android as neither of us owns an Iphone!!!

1. Navigate to "mobile" directory
```
cd mobile
```

2. Plug in Android device to computer

3. Confirm that Android is connected and developer options have been enabled by running:
```
yarn android-devices
```

4. Run the app on your device
```
yarn android
```

5. Adjust the # iterations and run benches by tapping "Prove Honk" 
