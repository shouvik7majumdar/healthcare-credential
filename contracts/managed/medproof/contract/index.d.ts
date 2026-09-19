import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  authorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deauthorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                      privateAdminSecret_0: Uint8Array,
                      providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  privateProviderSecret_0: Uint8Array,
                  commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   callerSecret_0: Uint8Array,
                   isCallerAdmin_0: boolean,
                   commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               patientSecret_0: Uint8Array,
               verifierPk_0: Uint8Array,
               credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                patientSecret_0: Uint8Array,
                verifierPk_0: Uint8Array,
                credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  advanceEpoch(context: __compactRuntime.CircuitContext<PS>,
               privateAdminSecret_0: Uint8Array,
               newEpoch_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setContractActive(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>,
                   issuerProviderCommitment_0: Uint8Array,
                   verifierPk_0: Uint8Array,
                   patientSecret_0: Uint8Array,
                   schemaId_0: bigint,
                   category_0: bigint,
                   expirationEpoch_0: bigint,
                   payloadHash_0: Uint8Array,
                   salt_0: Uint8Array,
                   requiredCategory_0: bigint,
                   sessionNonce_0: Uint8Array,
                   dispenseNullifier_0: Uint8Array,
                   isSingleUse_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  authorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deauthorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                      privateAdminSecret_0: Uint8Array,
                      providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  privateProviderSecret_0: Uint8Array,
                  commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   callerSecret_0: Uint8Array,
                   isCallerAdmin_0: boolean,
                   commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               patientSecret_0: Uint8Array,
               verifierPk_0: Uint8Array,
               credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                patientSecret_0: Uint8Array,
                verifierPk_0: Uint8Array,
                credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  advanceEpoch(context: __compactRuntime.CircuitContext<PS>,
               privateAdminSecret_0: Uint8Array,
               newEpoch_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setContractActive(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>,
                   issuerProviderCommitment_0: Uint8Array,
                   verifierPk_0: Uint8Array,
                   patientSecret_0: Uint8Array,
                   schemaId_0: bigint,
                   category_0: bigint,
                   expirationEpoch_0: bigint,
                   payloadHash_0: Uint8Array,
                   salt_0: Uint8Array,
                   requiredCategory_0: bigint,
                   sessionNonce_0: Uint8Array,
                   dispenseNullifier_0: Uint8Array,
                   isSingleUse_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  authorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deauthorizeProvider(context: __compactRuntime.CircuitContext<PS>,
                      privateAdminSecret_0: Uint8Array,
                      providerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  privateProviderSecret_0: Uint8Array,
                  commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   callerSecret_0: Uint8Array,
                   isCallerAdmin_0: boolean,
                   commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantConsent(context: __compactRuntime.CircuitContext<PS>,
               patientSecret_0: Uint8Array,
               verifierPk_0: Uint8Array,
               credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeConsent(context: __compactRuntime.CircuitContext<PS>,
                patientSecret_0: Uint8Array,
                verifierPk_0: Uint8Array,
                credentialCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  advanceEpoch(context: __compactRuntime.CircuitContext<PS>,
               privateAdminSecret_0: Uint8Array,
               newEpoch_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  setContractActive(context: __compactRuntime.CircuitContext<PS>,
                    privateAdminSecret_0: Uint8Array,
                    active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>,
                   issuerProviderCommitment_0: Uint8Array,
                   verifierPk_0: Uint8Array,
                   patientSecret_0: Uint8Array,
                   schemaId_0: bigint,
                   category_0: bigint,
                   expirationEpoch_0: bigint,
                   payloadHash_0: Uint8Array,
                   salt_0: Uint8Array,
                   requiredCategory_0: bigint,
                   sessionNonce_0: Uint8Array,
                   dispenseNullifier_0: Uint8Array,
                   isSingleUse_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly adminCommitment: Uint8Array;
  readonly isContractActive: boolean;
  readonly currentEpoch: bigint;
  readonly totalCredentialsIssued: bigint;
  readonly totalVerifications: bigint;
  authorizedProviders: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  credentialIssuers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  issuedCredentials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  revokedCredentials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  activeConsents: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               adminCommitmentParam_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
