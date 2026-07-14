// See https://regex101.com/r/dJUzdP/1
// Test strings:
//   string(format: email, xyz:a) id Test
//   string(format: email, xyz:a) id The ID of the envelope to retrieve.
//   string(format: 'email', xyz:a) i_d The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id The ID of the envelope to retrieve.
//   string(format: 'email',xyz:a) id The ID of the envelope to retrieve.
//   string id The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id? The ID of the envelope to retrieve.
//   string(format: 'email', xyz:a) id? The ID of the envelope to retrieve.
//   string(format: email, xyz:a) id? The ID of the envelope to retrieve.
//   string(format: 'email',xyz:a) id? The ID of the envelope to retrieve.
//   string id? The ID of the envelope to retrieve.
//   array(items: 'complete' | 'pending' | 'in progress' | 'declined' | 'canceled') enumArray? Match envelopes whose name contains this string
//   array(items: string) string_array Match envelopes whose name contains this string
//   IEnvelope . The detailed metadata for the envelope requested
//   IEnvelope[] . The caller's envelopes
//   string(format: 'email',xyz:a) id? The ID of the `IEnvelope` to retrieve.
const API_OPTION_REGEX = /([a-zA-Z0-9\[\]\/]+)(\([^)]*\))?\s([a-zA-Z0-9_?.]+)\s?([^\n]*)/;

export const parseApiOptionTag = (option: string) => {
  const matchArr = Array.from(option.match(API_OPTION_REGEX) || []);

  return {
    type: matchArr[1],
    options: matchArr[2],
    name: matchArr[3],
    desc: matchArr[4],
  };
};