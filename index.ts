import { SQS } from 'aws-sdk';
import { SQSEvent, Context, Callback } from 'aws-lambda';

const sqs = new SQS({region: 'us-east-1'});
const DLQ_URL = process.env.DLQ_URL!;
// const MAIN_QUEUE_URL = process.env.MAIN_QUEUE_URL!;
// const DLQ_URL = process.env.DLQ_URL; // Set these as environment variables 
let length_of_dlq: any = 0;
let MAIN_QUEUE_URL_FIFO: any = "";
let length_of_main_q_url_fifo: any = 0;
let MAIN_QUEUE_URL = "";
if (DLQ_URL.indexOf(".fifo")) {
    //arn:aws:sqs:us-east-1:487213271675:chimp-sandbox-audit-DLQ.fifo
    length_of_dlq = DLQ_URL.length;
    MAIN_QUEUE_URL_FIFO = DLQ_URL.toString().substring(0, length_of_dlq - 5);
    //MAIN_QUEUE_URL_FIFO = arn:aws:sqs:us-east-1:487213271675:chimp-sandbox-audit-DLQ
    length_of_main_q_url_fifo = MAIN_QUEUE_URL_FIFO.length;
    MAIN_QUEUE_URL = MAIN_QUEUE_URL_FIFO.toString().substring(0, length_of_main_q_url_fifo - 4) + ".fifo";
} else {
    // DLQ = arn:aws:sqs:us-east-1:487213271675:chimp-sandbox-audit-DLQ
    length_of_main_q_url_fifo = DLQ_URL.length;
    MAIN_QUEUE_URL = MAIN_QUEUE_URL_FIFO.toString().substring(0, length_of_main_q_url_fifo - 4);
}
//MAIN_QUEUE_URL = arn:aws:sqs:us-east-1:487213271675:chimp-sandbox-audit.fifo

export const handler = async (event: SQSEvent, context: Context, callback: Callback): Promise<void> => {
    try {
        const receiveParams: SQS.ReceiveMessageRequest = {
            QueueUrl: DLQ_URL,
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 30,
            WaitTimeSeconds: 10
        };

        const receivedMessages = await sqs.receiveMessage(receiveParams).promise();

        if (receivedMessages.Messages && receivedMessages.Messages.length > 0) {
            const sendMessagePromises = receivedMessages.Messages.map(async (message) => {
                const sendParams: SQS.SendMessageRequest = {
                    QueueUrl: MAIN_QUEUE_URL,
                    MessageBody: message.Body!,
                    MessageGroupId : "test",
                    MessageDeduplicationId : "test"
                };
                await sqs.sendMessage(sendParams).promise();

                const deleteParams: SQS.DeleteMessageRequest = {
                    QueueUrl: DLQ_URL,
                    ReceiptHandle: message.ReceiptHandle!
                };
                await sqs.deleteMessage(deleteParams).promise();
            });

            await Promise.all(sendMessagePromises);
        }

        callback(null, 'Messages processed successfully');
    } catch (error) {
        console.error('Error processing messages:', error);
        callback(error);
    }
};

