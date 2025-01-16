use std::{collections::bounded_vec::BoundedVec, hash::pedersen_hash};
use zkemail::{
    dkim::RSAPubkey,
    headers::{constrain_header_field, email_address::get_email_address},
    KEY_LIMBS_2048,
    MAX_EMAIL_ADDRESS_LENGTH,
    Sequence,
};

// Maximum length of a header of an email
global MAX_EMAIL_HEADER_LENGTH: u32 = 576;
// if index 11 = " " then length is 41, else 42
global DATE_LENGTH_DETERMINATION_INDEX: u32 = 11;
// max length of a "Date" field in an email header
global MAX_DATE_LENGTH: u32 = 38;
// max length of Subject we will allow
global MAX_SUBJECT_LENGTH: u32 = 100;

pub fn extract_header_field<let MAX_HEADER_FIELD_LENGTH: u32, let HEADER_FIELD_NAME_LENGTH: u32>(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    header_field_sequence: Sequence,
    header_name: [u8; HEADER_FIELD_NAME_LENGTH],
) -> BoundedVec<u8, MAX_HEADER_FIELD_LENGTH + 1> {
    // constrain the header field to be complete
    // constrain_header_field::<MAX_EMAIL_HEADER_LENGTH, MAX_HEADER_FIELD_LENGTH, HEADER_FIELD_NAME_LENGTH>(
    //     header,
    //     header_field_sequence,
    //     header_name,
    // );

    // copy the header field
    // use annoying trick to prevent conditional array assignment gate blowup
    // dont include (for example) "subject:" ... and "/r/n"
    let start_index = header_field_sequence.index + HEADER_FIELD_NAME_LENGTH + 1;
    let end_index = header_field_sequence.length - HEADER_FIELD_NAME_LENGTH - 3;
    let mut storage: [u8; MAX_HEADER_FIELD_LENGTH + 1] = [0; MAX_HEADER_FIELD_LENGTH + 1];
    for i in 0..MAX_HEADER_FIELD_LENGTH - HEADER_FIELD_NAME_LENGTH - 1 {
        let mut index = i;
        if i >= end_index {
            index = MAX_HEADER_FIELD_LENGTH;
        }
        storage[index] = header.get(start_index + i);
    }

    // set last byte to 0 again
    storage[MAX_HEADER_FIELD_LENGTH] = 0;

    // determine length of the extracted field (- field name len - ":" - "\r\n")
    let len = header_field_sequence.length - HEADER_FIELD_NAME_LENGTH - 1 - 2;

    // copy into a bounded vec with length set
    let extracted: BoundedVec<u8, MAX_HEADER_FIELD_LENGTH + 1> = BoundedVec { storage, len };
    extracted
}

/**
 * Extract the datetime, subject, and from email address from an email header
 *
 * @param header - The email header, 0-padded at end to the MAX_EMAIL_HEADER_LENGTH
 * @param pubkey - The DKIM RSA Public Key modulus and reduction parameter
 * @param signature - The DKIM RSA Signature
 * @param from_header_sequence - The index and length of the "From" header field
 * @param from_address_sequence - The index and length of the "From" email address
 * @return - 
 *         0: Pedersen hash of DKIM public key (root of trust)
 *         1: Pedersen hash of DKIM signature (email nullifier)
 */
fn main(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey: RSAPubkey<KEY_LIMBS_2048>,
    signature: [Field; KEY_LIMBS_2048],
    date_index: u32,
    subject_sequence: Sequence,
    from_header_sequence: Sequence,
    from_address_sequence: Sequence,
    ) -> pub ([Field; 2], BoundedVec<u8, MAX_EMAIL_ADDRESS_LENGTH>, BoundedVec<u8, MAX_DATE_LENGTH + 1>, BoundedVec<u8, MAX_SUBJECT_LENGTH + 1>) {
    // check the body and header lengths are within bounds
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH);

    // verify the dkim signature over the header
    pubkey.verify_dkim_signature(header, signature);

    // extract to and from email addresses
    let from: [u8; 4] = comptime { "from".as_bytes() };
    let date: [u8; 4] = comptime { "date".as_bytes() };
    let subject: [u8; 7] = comptime { "subject".as_bytes() };

    // 16k gate cost? has to be able to be brought down
    let from_address = get_email_address(header, from_header_sequence, from_address_sequence, from);

    // determine datetime length
    // determine the index of the selector that chooses the length of the date field
    let length_decider = date_index + DATE_LENGTH_DETERMINATION_INDEX;
    let date_length = if header.get(length_decider) == 0x20 {
        MAX_DATE_LENGTH - 1
    } else {
        MAX_DATE_LENGTH
    };
    // get datetime
    // let datetime = extract_datetime(header, date_index);
    let date_sequence = Sequence{
        index: date_index,
        length: date_length
    };
    let datetime = extract_header_field::<MAX_DATE_LENGTH, 4>(header, date_sequence, date);

    // get the subject
    let subject = extract_header_field::<MAX_SUBJECT_LENGTH, 7>(header, subject_sequence, subject);

    // hash the pubkey and signature for the standard outputs
    let email_nullifier = pedersen_hash(signature);
    let standard_out = [pubkey.hash(), email_nullifier];
    (standard_out, from_address, datetime, subject)
}

#[test]
fn test_email_circuit() {
    let header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH> = BoundedVec {
        storage: [
            116, 111, 58, 106, 112, 52, 103, 64, 109, 97, 99, 104, 51, 52, 46, 115, 112, 97, 99,
            101, 13, 10, 115, 117, 98, 106, 101, 99, 116, 58, 84, 104, 105, 115, 32, 105, 115, 32,
            97, 32, 116, 101, 115, 116, 32, 101, 109, 97, 105, 108, 13, 10, 109, 101, 115, 115, 97,
            103, 101, 45, 105, 100, 58, 60, 67, 65, 43, 114, 74, 106, 61, 122, 84, 87, 100, 56, 115,
            95, 52, 70, 120, 106, 79, 69, 75, 117, 106, 99, 48, 111, 76, 102, 85, 53, 76, 110, 48,
            61, 75, 61, 43, 105, 97, 84, 80, 103, 49, 71, 85, 113, 79, 48, 120, 50, 103, 64, 109,
            97, 105, 108, 46, 103, 109, 97, 105, 108, 46, 99, 111, 109, 62, 13, 10, 100, 97, 116,
            101, 58, 84, 117, 101, 44, 32, 49, 52, 32, 74, 97, 110, 32, 50, 48, 50, 53, 32, 50, 51,
            58, 48, 48, 58, 52, 50, 32, 45, 48, 55, 48, 48, 13, 10, 102, 114, 111, 109, 58, 74, 97,
            99, 107, 32, 71, 105, 108, 99, 114, 101, 115, 116, 32, 60, 103, 105, 108, 99, 114, 101,
            115, 116, 46, 106, 97, 99, 107, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109, 62, 13,
            10, 109, 105, 109, 101, 45, 118, 101, 114, 115, 105, 111, 110, 58, 49, 46, 48, 13, 10,
            100, 107, 105, 109, 45, 115, 105, 103, 110, 97, 116, 117, 114, 101, 58, 118, 61, 49, 59,
            32, 97, 61, 114, 115, 97, 45, 115, 104, 97, 50, 53, 54, 59, 32, 99, 61, 114, 101, 108,
            97, 120, 101, 100, 47, 114, 101, 108, 97, 120, 101, 100, 59, 32, 100, 61, 103, 109, 97,
            105, 108, 46, 99, 111, 109, 59, 32, 115, 61, 50, 48, 50, 51, 48, 54, 48, 49, 59, 32,
            116, 61, 49, 55, 51, 54, 57, 50, 48, 56, 53, 51, 59, 32, 120, 61, 49, 55, 51, 55, 53,
            50, 53, 54, 53, 51, 59, 32, 100, 97, 114, 110, 61, 109, 97, 99, 104, 51, 52, 46, 115,
            112, 97, 99, 101, 59, 32, 104, 61, 116, 111, 58, 115, 117, 98, 106, 101, 99, 116, 58,
            109, 101, 115, 115, 97, 103, 101, 45, 105, 100, 58, 100, 97, 116, 101, 58, 102, 114,
            111, 109, 58, 109, 105, 109, 101, 45, 118, 101, 114, 115, 105, 111, 110, 58, 102, 114,
            111, 109, 58, 116, 111, 58, 99, 99, 58, 115, 117, 98, 106, 101, 99, 116, 32, 58, 100,
            97, 116, 101, 58, 109, 101, 115, 115, 97, 103, 101, 45, 105, 100, 58, 114, 101, 112,
            108, 121, 45, 116, 111, 59, 32, 98, 104, 61, 65, 97, 90, 79, 101, 48, 105, 52, 51, 90,
            117, 108, 68, 90, 54, 83, 48, 55, 84, 108, 88, 85, 51, 51, 108, 121, 84, 67, 122, 99,
            118, 54, 116, 49, 88, 80, 89, 43, 52, 89, 77, 113, 81, 61, 59, 32, 98, 61, 128, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 15, 192,
        ],
        len: 504,
    };
    let pubkey: RSAPubkey<KEY_LIMBS_2048> = RSAPubkey {
        modulus: [
            0x95d4c106145000c13aeeedd678b05f,
            0xdb1707fb6ee7a2e61bbb440cd9ab67,
            0x9f5aa685b528f41ef1bad24a546c8b,
            0xff02c48d58d0538d96ab50620b28ad,
            0x3c08e0917cd795cc9d25636606145c,
            0xe1d265bd61b22b6b13454f6e1273c4,
            0xa41ea8eb5c5b8aebb07db82fb5e10f,
            0xe81f505e13e0765bd8f6366d0b443f,
            0x32a76308aae634320642d63fe2e018,
            0x5e51db415a2940011aee0d4db4767c,
            0x549dc4f0110e070cec0b111021f043,
            0x696168d1c7ecbc7e31d69bf3fcc337,
            0x8ab996377df7a009eee7764b238b42,
            0x0a9d31d535da1d957c44de38992019,
            0x2fd2a1d99f995b360f52801f79a2d4,
            0x06e8b83b09b817dbcbf4bcda3c6ca0,
            0xdbd2293d6192a84a7b4c5c699d31f9,
            0x9e,
        ],
        redc: [
            0x3fb74febc080da4b8324c69a64360d,
            0x780208b14e02ad09841ed76a8b37c6,
            0x2f764289f656d23ce3c1eb91c1f487,
            0xfc5e41a05066de39f2537c2f252204,
            0xec77198110c84b8bbd5f1993379a33,
            0xe6bd7b5ac7fc75808f9158307b3fef,
            0x12b8831ed1c93fea29c41f4e2b7dcd,
            0x9826bf4bd5f4030aa08e2b15791bca,
            0x01b0c74e64f36eaee89a393e5b1f4a,
            0xf9f071c58b4b194945ea8be9edb3d8,
            0xf0fad970f7fdd1b12b70e97819b0a8,
            0xd8ed3c75d627d56146e8ca3b723d69,
            0xecada80f9c693706b41028e709be14,
            0x1d64b969fc1752cd8a3b7f5861a2b4,
            0x0f82b2d9a0bffe9791a3b048fd6f3d,
            0x812c0467e043ab5f330abb8be8c98d,
            0xaf3c74ff5cdfcd04f75df324e1c60e,
            0x19c8,
        ],
    };
    let signature = [
        0x555d5af7bf175f4434295db07baced,
        0xf90ca3cb2cee102221a444eff9ab62,
        0x037389e42ee0f3f39f159d2ecb7c14,
        0x990554feb8000ca6af6c9f1be4e669,
        0x0cfe9a31b8048c9a4208231837c71b,
        0xa4b6024c47ce71416359c79cb108c4,
        0xc213998ca9e267b901993f513fbbb8,
        0x5eb53add722817f8ff5742fa617894,
        0xb4466636280c79b9dfbf384b7dc08a,
        0x01ad997b79752e4b80f88110f639fd,
        0xf3fdfdadac159c9b77ceff61a637fc,
        0xeabf496ad68f31a7cc35884a0ad4a4,
        0xa32bf2155518ed70425a74c981f17c,
        0x10f3a360de7d58f7d95af82f8c56d3,
        0x6251ec644341c6ce305bb1a51caac8,
        0x4a21f772dfb631f3803d6c115739a5,
        0x81473ffb00fbf59abd7b1d8d5e92ed,
        0x6d,
    ];
    let date_index: u32 = 133;
    let subject_sequence = Sequence { index: 22, length: 30 };
    let from_header_sequence = Sequence { index: 171, length: 44 };
    let from_address_sequence = Sequence { index: 191, length: 23 };

    // test main circuit
    let (_, from_address, datetime, subject) = main(
        header,
        pubkey,
        signature,
        date_index,
        subject_sequence,
        from_header_sequence,
        from_address_sequence,
    );

    // check the expected sender email address
    let expected_from_length: u32 = 23;
    let expected_from: [u8; 23] = comptime { "gilcrest.jack@gmail.com".as_bytes() };
    assert(from_address.len() == expected_from_length);
    for i in 0..expected_from_length {
        assert(from_address.get(i) == expected_from[i]);
    };
    
    // check the expected datetime
    let expected_datetime_length: u32 = 31;
    let expected_datetime: [u8; 31] = comptime { "Tue, 14 Jan 2025 23:00:42 -0700".as_bytes() };
    assert(datetime.len() == expected_datetime_length);
    for i in 0..expected_datetime_length {
        assert(datetime.get(i) == expected_datetime[i]);
    };
    
    // check the expected subject
    let expected_subject_length: u32 = 20;
    let expected_subject: [u8; 20] = comptime { "This is a test email".as_bytes() };
    assert(subject.len() == expected_subject_length);
    for i in 0..expected_subject_length {
        assert(subject.get(i) == expected_subject[i]);
    };
}
