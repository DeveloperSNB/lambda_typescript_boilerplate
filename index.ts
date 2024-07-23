import { SQS } from 'aws-sdk';
import { SQSEvent, Context, Callback } from 'aws-lambda';

export const handler = async (event: SQSEvent, context: Context, callback: Callback): Promise<void> => {
    try {
        
        callback(null, 'Messages processed successfully');
    } catch (error) {
        console.error('Error processing messages:', error);
        callback(error);
    }
};

