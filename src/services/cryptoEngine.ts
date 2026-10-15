/**
 * FreshRoute Cryptographic Engine
 * Real WebCrypto API implementation for:
 * 1. HMAC-SHA256 device-to-shore signing & verification
 * 2. AES-GCM encryption/decryption of confidential telemetry (position & cargo)
 * 3. SHA-256 payload hashing
 * 4. Append-only tamper-evident Audit Hash Chain with integrity verification
 */

import { AuditBlock, UserRole } from '../types';

// Demo device keys (In production, stored in AWS KMS or IoT Core X.509 certs)
const SHARED_HMAC_SECRET = 'FRESHROUTE_DEVICE_KEY_SECRET_SECURE_2026_MOCK_KMS';
const DEMO_AES_PASSPHRASE = 'FRESHROUTE_AES_GCM_PAYLOAD_CONFIDENTIALITY_KEY_2026';

let cachedHmacKey: CryptoKey | null = null;
let cachedAesKey: CryptoKey | null = null;

// Convert string to Uint8Array
function strToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to hex string
function bufToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Get or import HMAC key
async function getHmacKey(): Promise<CryptoKey> {
  if (cachedHmacKey) return cachedHmacKey;
  const rawKey = strToBuffer(SHARED_HMAC_SECRET);
  cachedHmacKey = await window.crypto.subtle.importKey(
    'raw',
    rawKey.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return cachedHmacKey;
}

// Get or derive AES-GCM key from passphrase
async function getAesKey(): Promise<CryptoKey> {
  if (cachedAesKey) return cachedAesKey;
  const rawSecret = strToBuffer(DEMO_AES_PASSPHRASE);
  // Hash to 256 bits for AES-256
  const hash = await window.crypto.subtle.digest('SHA-256', rawSecret.buffer as ArrayBuffer);
  cachedAesKey = await window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedAesKey;
}

/**
 * Compute SHA-256 hash of a string or JSON payload
 */
export async function computeSha256(data: string | object): Promise<string> {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const buffer = strToBuffer(content);
  const digest = await window.crypto.subtle.digest('SHA-256', buffer.buffer as ArrayBuffer);
  return bufToHex(digest);
}

/**
 * Sign data with HMAC-SHA256
 */
export async function signHmacSha256(data: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await window.crypto.subtle.sign('HMAC', key, strToBuffer(data).buffer as ArrayBuffer);
  return bufToHex(signature);
}

/**
 * Verify HMAC-SHA256 signature
 */
export async function verifyHmacSha256(data: string, signatureHex: string): Promise<boolean> {
  try {
    const key = await getHmacKey();
    const sigBuf = hexToBuf(signatureHex);
    return await window.crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf.buffer as ArrayBuffer,
      strToBuffer(data).buffer as ArrayBuffer
    );
  } catch (err) {
    console.warn('HMAC verification error:', err);
    return false;
  }
}

/**
 * Encrypt confidential payload using AES-256-GCM
 * Returns { ciphertextHex, ivHex }
 */
export async function encryptAesGcm(plainObj: object | string): Promise<{ ciphertextHex: string; ivHex: string }> {
  const key = await getAesKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for GCM
  const plainText = typeof plainObj === 'string' ? plainObj : JSON.stringify(plainObj);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    strToBuffer(plainText).buffer as ArrayBuffer
  );

  return {
    ciphertextHex: bufToHex(encrypted),
    ivHex: bufToHex(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt AES-256-GCM payload
 */
export async function decryptAesGcm<T = unknown>(ciphertextHex: string, ivHex: string): Promise<T | null> {
  try {
    const key = await getAesKey();
    const iv = hexToBuf(ivHex);
    const cipherData = hexToBuf(ciphertextHex);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      cipherData.buffer as ArrayBuffer
    );
    const plainText = new TextDecoder().decode(decrypted);
    return JSON.parse(plainText) as T;
  } catch (err) {
    console.warn('AES-GCM Decryption failed (corrupt or tampered ciphertext):', err);
    return null;
  }
}

/**
 * Append-Only Tamper-Evident Audit Hash Chain
 */
class AuditLogManager {
  private chain: AuditBlock[] = [];
  private genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this.initGenesis();
  }

  private async initGenesis() {
    const genesisBlockData = {
      index: 0,
      timestamp: new Date().toISOString(),
      eventType: 'SYSTEM_GENESIS',
      role: 'SYSTEM_ADMIN' as UserRole,
      actor: 'FreshRoute-Root-Authority',
      dataSummary: 'FreshRoute Resilience Platform initialized with MedGuard audit anchor.',
      payload: { platform: 'FreshRoute-v2.6', targetInfra: 'AWS IoT Core & KMS Mock' },
      prevHash: this.genesisHash,
    };
    const blockHash = await computeSha256(JSON.stringify(genesisBlockData));
    const signature = await signHmacSha256(blockHash);

    this.chain.push({
      ...genesisBlockData,
      hash: blockHash,
      signatureHmac: signature,
    });
  }

  public getChain(): AuditBlock[] {
    return [...this.chain];
  }

  public async appendEntry(
    eventType: string,
    role: UserRole,
    actor: string,
    dataSummary: string,
    payload: Record<string, unknown>
  ): Promise<AuditBlock> {
    const prevBlock = this.chain[this.chain.length - 1];
    const prevHash = prevBlock ? prevBlock.hash : this.genesisHash;
    const index = this.chain.length;
    const timestamp = new Date().toISOString();

    const blockBase = {
      index,
      timestamp,
      eventType,
      role,
      actor,
      dataSummary,
      payload,
      prevHash,
    };

    const hash = await computeSha256(JSON.stringify(blockBase));
    const signatureHmac = await signHmacSha256(hash);

    const fullBlock: AuditBlock = {
      ...blockBase,
      hash,
      signatureHmac,
    };

    this.chain.push(fullBlock);
    return fullBlock;
  }

  /**
   * Verify every block in the hash chain.
   * Checks:
   * 1. hash == sha256(block_contents)
   * 2. block[i].prevHash == block[i-1].hash
   * 3. HMAC signature validity
   * Returns verification result and index of first broken link if any.
   */
  public async verifyIntegrity(): Promise<{
    isValid: boolean;
    brokenIndex: number | null;
    reason: string | null;
    totalBlocksChecked: number;
  }> {
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      // Check prevHash
      if (i === 0) {
        if (block.prevHash !== this.genesisHash) {
          return {
            isValid: false,
            brokenIndex: 0,
            reason: 'Genesis block prevHash does not match zero anchor',
            totalBlocksChecked: i + 1,
          };
        }
      } else {
        const prevBlock = this.chain[i - 1];
        if (block.prevHash !== prevBlock.hash) {
          return {
            isValid: false,
            brokenIndex: i,
            reason: `Broken chain link at Block #${i}: prevHash does not equal Block #${i - 1} hash!`,
            totalBlocksChecked: i + 1,
          };
        }
      }

      // Recompute SHA-256 hash
      const blockBase = {
        index: block.index,
        timestamp: block.timestamp,
        eventType: block.eventType,
        role: block.role,
        actor: block.actor,
        dataSummary: block.dataSummary,
        payload: block.payload,
        prevHash: block.prevHash,
      };
      const expectedHash = await computeSha256(JSON.stringify(blockBase));
      if (block.hash !== expectedHash) {
        return {
          isValid: false,
          brokenIndex: i,
          reason: `Tampered content in Block #${i}: Recomputed hash (${expectedHash.slice(0, 10)}...) does not match recorded block hash (${block.hash.slice(0, 10)}...)!`,
          totalBlocksChecked: i + 1,
        };
      }

      // Check HMAC signature
      const isSigValid = await verifyHmacSha256(block.hash, block.signatureHmac);
      if (!isSigValid) {
        return {
          isValid: false,
          brokenIndex: i,
          reason: `Forged HMAC signature in Block #${i}! Key authentication failed.`,
          totalBlocksChecked: i + 1,
        };
      }
    }

    return {
      isValid: true,
      brokenIndex: null,
      reason: 'All cryptographic links, hashes, and HMAC signatures verified intact.',
      totalBlocksChecked: this.chain.length,
    };
  }

  /**
   * Tamper injection test for the demo
   */
  public tamperWithBlock(targetIndex: number, fakeSummary: string) {
    if (this.chain[targetIndex]) {
      this.chain[targetIndex].dataSummary = fakeSummary;
      // Deliberately do not recompute hash or subsequent prevHashes to demonstrate tamper detection
    }
  }

  public resetChain() {
    this.chain = [];
    this.initGenesis();
  }
}

export const auditLog = new AuditLogManager();
