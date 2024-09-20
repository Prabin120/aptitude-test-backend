const feedbackResponseBody = (recipientName: string) => `
      <p>Dear ${recipientName},</p>
      <p>Thank you for taking the time to share your feedback regarding our <strong>services/products</strong>. 
      We truly appreciate your input and value your insights.</p>
      
      <p>At <strong>AptiTest</strong>, we constantly strive to improve, and your feedback is essential in helping us enhance our offerings. We are reviewing your suggestions and will take appropriate actions to address any concerns you've raised.</p>

      <p>If you have any additional thoughts, please don't hesitate to get in touch. We look forward to continuing to provide you with the best possible service.</p>

      <p>Best regards,</p>
      <p><strong>Prabin Sharma</strong></p>
      <p><strong>AptiTest</strong></p>
    `
const feedbackResponseSubject = 'Thank You for Your Feedback'

export {feedbackResponseBody, feedbackResponseSubject}