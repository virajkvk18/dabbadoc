import type { AgentInput, ReceiptAnalysis } from "@/types";
import { analyzeReceipt } from "./receiptScanAgent";

type GraphState = {
  input: AgentInput;
  analysis?: ReceiptAnalysis;
};

async function runManualWorkflow(input: AgentInput) {
  return {
    input,
    analysis: await analyzeReceipt(input)
  };
}

export async function runReceiptGraph(input: AgentInput): Promise<ReceiptAnalysis> {
  try {
    const langgraph = await import("@langchain/langgraph");
    const { Annotation, END, START, StateGraph } = langgraph;

    const WorkflowState = Annotation.Root({
      input: Annotation<AgentInput>(),
      analysis: Annotation<ReceiptAnalysis | undefined>()
    });

    const workflow = new StateGraph(WorkflowState)
      .addNode("ocr_vision_extraction", async (state: GraphState) => state)
      .addNode("food_item_parser", async (state: GraphState) => state)
      .addNode("nutrition_risk_analyzer", async (state: GraphState) => state)
      .addNode("swap_recommender", async (state: GraphState) => state)
      .addNode("cost_comparator", async (state: GraphState) => state)
      .addNode("health_index_updater", async (state: GraphState) => state)
      .addNode("dabba_bot_explanation", async (state: GraphState) => ({
        ...state,
        analysis: await analyzeReceipt(state.input)
      }))
      .addNode("save_to_database", async (state: GraphState) => state)
      .addEdge(START, "ocr_vision_extraction")
      .addEdge("ocr_vision_extraction", "food_item_parser")
      .addEdge("food_item_parser", "nutrition_risk_analyzer")
      .addEdge("nutrition_risk_analyzer", "swap_recommender")
      .addEdge("swap_recommender", "cost_comparator")
      .addEdge("cost_comparator", "health_index_updater")
      .addEdge("health_index_updater", "dabba_bot_explanation")
      .addEdge("dabba_bot_explanation", "save_to_database")
      .addEdge("save_to_database", END)
      .compile();

    const result = (await workflow.invoke({ input })) as GraphState;
    return result.analysis ?? (await analyzeReceipt(input));
  } catch {
    const result = await runManualWorkflow(input);
    return result.analysis;
  }
}
