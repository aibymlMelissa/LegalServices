import warnings
warnings.filterwarnings("ignore", message=".*TqdmWarning.*")
from dotenv import load_dotenv

_ = load_dotenv()

from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
import operator
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
import sqlite3


class AgentState(TypedDict):
    task: str
    lnode: str
    plan: str
    draft: str  # Changed from design to draft for consistency
    critique: str
    revision_number: int
    max_revisions: int
    count: Annotated[int, operator.add]


class SimplifiedCourseWriter:
    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4o", temperature=0.8)
        
        # System prompts for each node
        self.PLAN_PROMPT = (" You are an researcher tasked to gather possible topics related to the topic. "
                            " Write such an outline for the user provided topic. Give the two paragraphs for the introduction of the course of the topic"
                             " include a list of possible ares of the topic. "
                             " the research along with any relevant notes or materials for the course content.")
        
        self.WRITER_PROMPT = (" There are 'complusory' areas in the course content, such as Business Service Management with innovations in business marketing is transforming the way businesses connect with customers by achieving Sustainable Development Goals and knowledge of environment social goverance in decision making"
                              " It also needs to encourage embracing transformative mindsets and adopting cutting-edge technologies, for example, Ai in service re- design with self management learning techniques for business activites"
                              " The course leads students be trained as pioneer sustainable artifical intelligence self management service designers and auditors with circular economy mindset for growth, transform and innovate to mprove satisfaction in life, career, peer relationship and community bonding" 
                              " You are a course design assistant tasked with construct course content based on PLAN areas with descriptions less than 20 words. "
                              " Generate the best essay possible for the user's request and the initial outline. "
                              " If the user provides critique, respond with a revised version of your previous attempts.")
        
        self.REFLECTION_PROMPT = ("You are a teacher check the course suitable for. "
                                  " Check the course content able to develop techniques of self learnng and self management for sustainable business with AI"
                                  " Check the course content able to nurture business partners and models to serve and make responsible business" 
                                  " Generate learning methods and recommendations on evaluation criteria. "
                                  " Provide detailed recommendations, including requests for length, depth, style, etc.")
        
        # Build the graph
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("planner", self.plan_node)
        builder.add_node("course designer", self.writer_node)
        builder.add_node("reflect", self.reflection_node)
        
        # Set entry point
        builder.set_entry_point("planner")
        
        # Add edges
        builder.add_conditional_edges(
            "course designer", 
            self.should_continue, 
            {END: END, "reflect": "reflect"}
        )
        
        builder.add_edge("planner", "course designer")
        builder.add_edge("reflect", "course designer")
        
        # Set up memory
        memory = SqliteSaver(conn=sqlite3.connect(":memory:", check_same_thread=False))
        
        # Compile graph
        self.graph = builder.compile(
            checkpointer=memory,
            interrupt_after=['planner', 'course designer', 'reflect']
        )

    def plan_node(self, state: AgentState):
        messages = [
            SystemMessage(content=self.PLAN_PROMPT), 
            HumanMessage(content=state['task'])
        ]
        response = self.model.invoke(messages)
        # Return a complete state with all required keys and default values
        return {
            "plan": response.content,
            "lnode": "planner",
            "draft": state.get('draft', "no draft yet"),  # Add default draft
            "critique": state.get('critique', "no critique yet"),  # Add default critique
            "revision_number": state.get('revision_number', 0),  # Add revision number
            "max_revisions": state.get('max_revisions', 2),  # Preserve max revisions
            "count": 1,
            "task": state.get('task', "")  # Preserve the task
        }
    
    def writer_node(self, state: AgentState):
        try:
            # Safely access state with defaults
            task = state.get('task', "")
            plan = state.get('plan', "No plan available")
            
            user_message = HumanMessage(
                content=f"{task}\n\nHere is my plan:\n\n{plan}")
            
            messages = [
                SystemMessage(content=self.WRITER_PROMPT),
                user_message
            ]
            
            # If there's critique, add it to the context
            if state.get('critique'):
                messages.append(HumanMessage(content=f"Here is feedback on my previous draft:\n\n{state['critique']}"))
            
            response = self.model.invoke(messages)
            
            # Return complete state with all required keys
            return {
                "draft": response.content,
                "plan": state.get('plan', ""),  # Preserve plan
                "critique": state.get('critique', "no critique yet"),  # Preserve critique
                "task": state.get('task', ""),  # Preserve task
                "revision_number": state.get("revision_number", 0) + 1,
                "max_revisions": state.get("max_revisions", 2),  # Preserve max revisions
                "lnode": "course designer",
                "count": state.get("count", 0) + 1,
            }
        except Exception as e:
            print(f"Error in writer_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "draft": "Error occurred during content generation.",
                "plan": state.get('plan', ""),
                "critique": state.get('critique', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0) + 1,
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "course designer",
                "count": state.get("count", 0) + 1,
            }
    
    def reflection_node(self, state: AgentState):
        try:
            # Safely access state with default
            draft = state.get('draft', "No content available")
            
            messages = [
                SystemMessage(content=self.REFLECTION_PROMPT), 
                HumanMessage(content=draft)
            ]
            
            response = self.model.invoke(messages)
            
            # Return complete state with all required keys
            return {
                "critique": response.content,
                "draft": state.get('draft', ""),  # Preserve draft
                "plan": state.get('plan', ""),  # Preserve plan
                "task": state.get('task', ""),  # Preserve task
                "revision_number": state.get("revision_number", 0),  # Preserve revision number
                "max_revisions": state.get("max_revisions", 2),  # Preserve max revisions
                "lnode": "reflect",
                "count": state.get("count", 0) + 1,
            }
        except Exception as e:
            print(f"Error in reflection_node: {e}")
            # Return a minimal valid state in case of error
            return {
                "critique": "Error occurred during reflection.",
                "draft": state.get('draft', ""),
                "plan": state.get('plan', ""),
                "task": state.get('task', ""),
                "revision_number": state.get("revision_number", 0),
                "max_revisions": state.get("max_revisions", 2),
                "lnode": "reflect",
                "count": state.get("count", 0) + 1,
            }
    
    def should_continue(self, state):
        try:
            revision_number = state.get("revision_number", 0)
            max_revisions = state.get("max_revisions", 2)
            
            if revision_number > max_revisions:
                print(f"Reached maximum revisions ({max_revisions}). Ending process.")
                return END
            
            print(f"Continuing to reflection. Revision {revision_number} of {max_revisions}")
            return "reflect"
        except Exception as e:
            print(f"Error in should_continue: {e}")
            # If there's an error, default to ending the process
            return END

# Remove circular import
# from simplified_gui import SimplifiedCSGUI

# Usage example
if __name__ == "__main__":
    essay_writer = SimplifiedCourseWriter()
    # Import here to avoid circular import
    from simplified_gui import SimplifiedCSGUI
    app = SimplifiedCSGUI(essay_writer.graph)
    app.launch()
