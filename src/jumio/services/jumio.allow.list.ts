const list = {
  liveness: [
    {
      type: 'REJECTED',
      labels: [
        'LIVENESS_UNDETERMINED',
        'ID_USED_AS_SELFIE',
        'MULTIPLE_PEOPLE',
        'DIGITAL_COPY',
        'PHOTOCOPY',
        'MANIPULATED',
        'NO_FACE_PRESENT',
        'FACE_NOT_FULLY_VISIBLE',
        'BLACK_WHITE',
      ],
    },
    {
      type: 'PASSED',
      labels: ['OK'],
    },
    {
      type: 'WARNING',
      labels: ['AGE_DIFFERENCE', 'BAD_QUALITY'],
    },
    {
      type: 'NOT_EXECUTED',
      labels: ['PRECONDITION_NOT_FULFILLED', 'TECHNICAL_ERROR'],
    },
  ],
  extraction: [
    {
      type: 'NOT_EXECUTED',
      labels: ['PRECONDITION_NOT_FULFILLED', 'TECHNICAL_ERROR'],
    },
    {
      type: 'PASSED',
      labels: ['OK'],
    },
  ],
  similarity: [
    {
      type: 'REJECTED',
      labels: ['NO_MATCH'],
    },
    {
      type: 'PASSED',
      labels: ['MATCH'],
    },
    {
      type: 'WARNING',
      labels: [],
    },
    {
      type: 'NOT_EXECUTED',
      labels: ['PRECONDITION_NOT_FULFILLED', 'TECHNICAL_ERROR'],
    },
  ],
  dataChecks: [
    {
      type: 'NOT_EXECUTED',
      labels: ['PRECONDITION_NOT_FULFILLED', 'TECHNICAL_ERROR'],
    },
    {
      type: 'PASSED',
      labels: ['OK'],
    },
    {
      type: 'REJECTED',
      labels: [],
    },
  ],
  imageChecks: [
    {
      type: 'NOT_EXECUTED',
      labels: ['PRECONDITION_NOT_FULFILLED', 'TECHNICAL_ERROR'],
    },
    {
      type: 'PASSED',
      labels: ['OK'],
    },
    {
      type: 'REJECTED',
      labels: ['DIGITAL_COPY'],
    },
    {
      type: 'WARNING',
      labels: ['REPEATED_FACE'],
    },
  ],
  usability: [
    {
      type: 'NOT_EXECUTED',
      labels: ['TECHNICAL_ERROR', 'NOT_UPLOADED'],
    },
    {
      type: 'PASSED',
      labels: ['OK'],
    },
    {
      type: 'REJECTED',
      labels: ['BAD_QUALITY', 'BLACK_WHITE', 'PHOTOCOPY', 'MISSING_PAGE'],
    },
    {
      type: 'WARNING',
      labels: ['LIVENESS_UNDETERMINED', 'UNSUPPORTED_DOCUMENT_TYPE'],
    },
  ],
};

export default list;
