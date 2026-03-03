import boto3
import os
from dotenv import load_dotenv

load_dotenv()

class RightsChatbotService:
    def __init__(self):
        # AWS Bedrock - Knowledge Base Retrieval
        self.bedrock_agent_runtime = boto3.client(
            service_name='bedrock-agent-runtime',
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )

        # AWS Bedrock - Text Generation (Amazon Nova)
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )

        # Amazon Nova Lite - no Marketplace subscription needed
        self.model_id = "amazon.nova-lite-v1:0"
        self.kb_id = os.getenv("AWS_KB_ID")

    async def answer_legal_query(self, question: str):
        try:
            # STEP 1: RETRIEVE from AWS Knowledge Base
            kb_response = self.bedrock_agent_runtime.retrieve(
                retrievalQuery={'text': question},
                knowledgeBaseId=self.kb_id,
                retrievalConfiguration={
                    'vectorSearchConfiguration': {'numberOfResults': 5}
                }
            )

            # STEP 2: Process Context & Citations
            sources = []
            context_text = ""
            for result in kb_response.get('retrievalResults', []):
                content = result['content']['text']
                location = result.get('location', {}).get('s3Location', {}).get('uri', "Legal Document")

                context_text += f"\n---\n{content}\n"
                sources.append({"text": content, "location": location})

            if not sources:
                return "I couldn't find specific legal documents regarding this in our database.", []

            # STEP 3: GENERATE with Amazon Nova via Bedrock
            prompt = f"""You are NyayaBharat, an expert in Indian Law. \
Use the following context to answer the user's question accurately and clearly.

Context:
{context_text}

User Question: {question}
"""

            nova_response = self.bedrock_runtime.converse(
                modelId=self.model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ]
            )

            answer = nova_response["output"]["message"]["content"][0]["text"]
            return answer, sources

        except Exception as kb_error:
            if "bedrock-agent-runtime" in str(type(kb_error)):
                return f"Knowledge Base Error: {str(kb_error)}", []
            return f"Generation Error: {str(kb_error)}", []