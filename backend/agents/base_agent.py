"""
BaseAgent — shared foundation for TaxFront AI agents.

Both the Auditor and Accountant agents inherit from this class. The base handles:
  • LLM construction (OpenAI, configurable model / temperature)
  • Common tool assembly (document retrieval tools that both agents need)
  • Agent graph setup using LangChain 1.x `create_agent` (LangGraph-backed)
  • Public `run()` and `stream()` interface that callers use

Design notes
------------
* We avoid module-level LLM or Firestore instances. Everything is constructed inside
  __init__ so tests can inject mocks and multiple agent instances can coexist.
* Temperature=0 is the default because tax analysis requires determinism.
* `create_agent` (LangChain 1.x) returns a CompiledStateGraph that uses tool-calling
  natively. It replaced the older `create_openai_tools_agent` + `AgentExecutor` pattern.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI

from .tools.document_tools import create_document_tools

logger = logging.getLogger(__name__)


class BaseAgent:
    """
    Base class for TaxFront agents.

    Subclasses must implement:
      • _get_system_prompt() -> str
      • _get_specialized_tools() -> List[BaseTool]
    """

    def __init__(
        self,
        db,
        model: str = "gpt-4o-mini",
        temperature: float = 0.0,
        verbose: bool = False,
        openai_api_key: Optional[str] = None,
    ):
        """
        Args:
            db: Firestore client (firebase_admin.firestore or google.cloud.firestore).
            model: OpenAI model name. gpt-4o-mini is the default — fast and cost-effective
                   for structured tool-use tasks. Use gpt-4o for complex multi-document analysis.
            temperature: LLM temperature. Keep at 0 for tax work.
            verbose: Enable LangGraph debug output (logs every graph node transition).
            openai_api_key: Optional API key. If None, reads from OPENAI_API_KEY env var.
        """
        self.db = db

        self._llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            **({"api_key": openai_api_key} if openai_api_key else {}),
        )

        tools = create_document_tools(db) + self._get_specialized_tools()

        # create_agent (LangChain 1.x) compiles a LangGraph-backed agent that handles
        # the tool-call loop automatically. The system_prompt sets the agent's role.
        self._graph = create_agent(
            model=self._llm,
            tools=tools,
            system_prompt=self._get_system_prompt(),
            debug=verbose,
        )

        # Keep tool list accessible for inspection (tests, logging)
        self._tools = tools

    # ------------------------------------------------------------------
    # Interface for subclasses
    # ------------------------------------------------------------------

    @staticmethod
    def _load_skill(skill_name: str) -> str:
        path = Path(__file__).parent / "skills" / f"{skill_name}.md"
        return path.read_text(encoding="utf-8")

    def _get_system_prompt(self) -> str:
        # Convention: AccountantAgent → skills/accountant.md
        skill_name = type(self).__name__.removesuffix("Agent").lower()
        return self._load_skill(skill_name)

    def _get_specialized_tools(self) -> List[BaseTool]:
        raise NotImplementedError

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def run(
        self,
        task: str,
        chat_history: Optional[List] = None,
    ) -> Dict[str, Any]:
        """
        Execute the agent on a task and return the result synchronously.

        Args:
            task: Natural-language description of what the agent should do.
            chat_history: Optional list of previous BaseMessage objects for multi-turn use.

        Returns:
            A dict with:
              "output"    — the agent's final answer (string)
              "messages"  — full message history including tool calls
        """
        logger.info("[%s] Starting task: %s", self.__class__.__name__, task[:120])
        try:
            messages = list(chat_history or []) + [HumanMessage(content=task)]
            result = self._graph.invoke({"messages": messages})
            # The final answer is the last AI message
            output = result["messages"][-1].content
            logger.info("[%s] Task completed.", self.__class__.__name__)
            return {"output": output, "messages": result["messages"]}
        except Exception as exc:
            logger.error("[%s] Task failed: %s", self.__class__.__name__, exc)
            raise

    def stream(
        self,
        task: str,
        chat_history: Optional[List] = None,
    ) -> Iterator[Dict[str, Any]]:
        """
        Stream agent graph events as they happen (tool calls, partial answers).

        Yields dicts from the compiled graph's stream() — each dict maps a node name
        to its output. Useful for real-time UI updates.
        """
        logger.info("[%s] Starting streaming task: %s", self.__class__.__name__, task[:120])
        messages = list(chat_history or []) + [HumanMessage(content=task)]
        yield from self._graph.stream({"messages": messages})
