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

## Instructions for running browser benchmarks

1. Navigate to browser directory
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

## Instructions for running mobile benchmarks
