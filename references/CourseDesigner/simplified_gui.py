import gradio as gr
import os

"""
Course Design Assistant Application
===================================

This application provides an AI-powered interface for designing educational courses.
It uses a three-step process:

1. Planning: The AI creates an outline and introduction for the course.
2. Course Design: The AI generates detailed course content based on the plan.
3. Reflection: The AI critiques the course and provides improvement suggestions.

Instructions for Use:
--------------------

1. Start the Application:
   - Enter your desired course name in the "Course Name" field
   - Click "Generate Course Content" to begin the process

2. Navigate Through Tabs:
   - Agent Tab: Control panel for the design process
   - Plan Tab: View and modify the course outline
   - Design Tab: View and modify the course content
   - Critique Tab: View and modify the critique
   - StateSnapShots Tab: View the history of changes

3. Design Workflow:
   - The process starts in the "planner" stage
   - After planning completes, click "Continue Design Process"
   - The system will move to the "course designer" and then "reflect" stages
   - You can make modifications in any tab and continue the process
   - The system will stop after a maximum of 2 revision cycles

4. Managing Multiple Designs:
   - Each new generation creates a new "thread"
   - You can switch between different designs using the "select thread" dropdown
   - You can also restore previous states using the "select step" dropdown

For more information, contact the application administrator.
"""

class SimplifiedCSGUI:
    def __init__(self, graph, share=False):
        self.graph = graph
        self.share = share
        self.partial_message = ""
        self.response = {}
        self.max_iterations = 10
        self.iterations = []
        self.threads = []
        self.thread_id = -1
        self.thread = {"configurable": {"thread_id": str(self.thread_id)}}
        self.demo = self.create_interface()

    def run_agent(self, start, topic, stop_after):
        try:
            # Print debugging info
            print(f"\n{'='*50}")
            print(f"AGENT RUN: start={start}, topic={topic}, stop_after={stop_after}")
            
            if start:
                self.iterations.append(0)
                self.partial_message = ""  # Reset message on new thread
                config = {
                    'task': topic,
                    "max_revisions": 2,
                    "revision_number": 0,
                    'lnode': "", 
                    'plan': "no plan", 
                    'draft': "no draft", 
                    'critique': "no critique", 
                    'count': 0
                }
                self.thread_id += 1  # new agent, new thread
                self.threads.append(self.thread_id)
                print(f"Created new thread {self.thread_id} with config: {config}")
            else:
                config = None
                print(f"Continuing with existing thread {self.thread_id}")
                
            self.thread = {"configurable": {"thread_id": str(self.thread_id)}}
            
            while self.iterations[self.thread_id] < self.max_iterations:
                print(f"Iteration {self.iterations[self.thread_id]} of {self.max_iterations}")
                
                # Invoke graph with error handling
                try:
                    self.response = self.graph.invoke(config, self.thread)
                    print(f"Graph response received: {type(self.response)}")
                except Exception as e:
                    print(f"ERROR invoking graph: {e}")
                    self.partial_message += f"Error in processing: {str(e)}\n"
                    yield self.partial_message, "error", "", self.thread_id, 0, 0
                    return
                
                self.iterations[self.thread_id] += 1
                self.partial_message += str(self.response)
                self.partial_message += f"\n------------------\n\n"
                
                # Get display state with error handling
                try:
                    lnode, nnode, _, rev, acount = self.get_disp_state()
                    print(f"Current state: lnode={lnode}, nnode={nnode}, rev={rev}, count={acount}")
                except Exception as e:
                    print(f"ERROR getting display state: {e}")
                    lnode, nnode, rev, acount = "error", "", 0, 0
                
                yield self.partial_message, lnode, nnode, self.thread_id, rev, acount
                
                config = None
                
                if not nnode:  
                    print("No next node, returning")
                    return
                    
                if lnode in stop_after:
                    print(f"Stopping after node {lnode} as requested")
                    return
            
            print("Reached maximum iterations")
            return
            
        except Exception as e:
            print(f"CRITICAL ERROR in run_agent: {e}")
            self.partial_message += f"Critical error occurred: {str(e)}\n"
            yield self.partial_message, "error", "", self.thread_id, 0, 0
            return
    
    def get_disp_state(self):
        try:
            current_state = self.graph.get_state(self.thread)
            
            # Debug print
            print(f"Current state retrieved: {current_state}")
            if hasattr(current_state, 'values'):
                print(f"State values: {current_state.values}")
                
            # Default values
            lnode = ""
            acount = 0
            rev = 0
            nnode = ""
            
            # Extract values safely
            if hasattr(current_state, 'values'):
                lnode = current_state.values.get("lnode", "")
                acount = current_state.values.get("count", 0)
                rev = current_state.values.get("revision_number", 0)
                
            if hasattr(current_state, 'next'):
                nnode = current_state.next
                
            # Convert values to appropriate types
            try:
                acount = int(acount) if acount is not None else 0
            except (ValueError, TypeError):
                acount = 0
                
            try:
                rev = int(rev) if rev is not None else 0
            except (ValueError, TypeError):
                rev = 0
                
            # Ensure string values
            lnode = str(lnode) if lnode is not None else ""
            nnode = str(nnode) if nnode is not None else ""
            
            print(f"Returning display state: lnode={lnode}, nnode={nnode}, rev={rev}, count={acount}")
            return lnode, nnode, self.thread_id, rev, acount
            
        except Exception as e:
            print(f"ERROR in get_disp_state: {e}")
            # Return default values in case of error
            return "error", "error", self.thread_id, 0, 0
    
    def get_state(self, key):
        try:
            print(f"\nGetting state for key: {key}")
            
            # Get current state
            try:
                current_values = self.graph.get_state(self.thread)
                print(f"Retrieved current state: {current_values}")
            except Exception as e:
                print(f"Error retrieving state: {e}")
                return gr.update(label=f"Error: {str(e)[:50]}...", value="")
            
            # Validate state
            if not current_values or not hasattr(current_values, 'values'):
                print("No valid state values available")
                return gr.update(label="No state available", value="")
            
            # Map key names to be consistent with the agent
            key_map = {
                "design": "draft"  # Map "design" to "draft"
            }
            search_key = key_map.get(key, key)
            
            print(f"Searching for key: {search_key} in state")
            print(f"Available keys: {list(current_values.values.keys())}")
            
            # Check if key exists
            if search_key in current_values.values:
                # Get display state information
                try:
                    lnode, nnode, _, rev, astep = self.get_disp_state()
                except Exception as e:
                    print(f"Error getting display state: {e}")
                    lnode, nnode, rev, astep = "unknown", "unknown", 0, 0
                
                # Create label
                new_label = f"Last Node: {lnode}, Thread: {self.thread_id}, Rev: {rev}, Step: {astep}"
                
                # Get value
                value = current_values.values[search_key]
                if value is None:
                    value = ""
                
                print(f"Returning value with label: {new_label}")
                return gr.update(label=new_label, value=value)
            else:
                print(f"Key {search_key} not found in state")
                return gr.update(label=f"Key '{key}' not found in current state", value="")
                
        except Exception as e:
            print(f"Error getting state for {key}: {e}")
            return gr.update(label=f"Error: {str(e)[:50]}...", value="")
    
    def update_hist_pd(self):
        hist = []
        for state in self.graph.get_state_history(self.thread):
            if state.metadata['step'] < 1:
                continue
            thread_ts = state.config['configurable']['thread_ts']
            tid = state.config['configurable']['thread_id']
            count = state.values.get('count', 0)
            lnode = state.values.get('lnode', "")
            rev = state.values.get('revision_number', 0)
            nnode = state.next
            st = f"{tid}:{count}:{lnode}:{nnode}:{rev}:{thread_ts}"
            hist.append(st)
        return gr.Dropdown(label="update_state from: thread:count:last_node:next_node:rev:thread_ts", 
                          choices=hist, value=hist[0] if hist else "", interactive=True)
    
    def find_config(self, thread_ts):
        for state in self.graph.get_state_history(self.thread):
            config = state.config
            if config['configurable']['thread_ts'] == thread_ts:
                return config
        return None
            
    def copy_state(self, hist_str):
        if not hist_str:
            return "", "", "", 0, 0
        thread_ts = hist_str.split(":")[-1]
        config = self.find_config(thread_ts)
        if not config:
            return "", "", "", 0, 0
        state = self.graph.get_state(config)
        self.graph.update_state(self.thread, state.values, as_node=state.values.get('lnode', ""))
        new_state = self.graph.get_state(self.thread)
        new_thread_ts = new_state.config['configurable']['thread_ts']
        tid = new_state.config['configurable']['thread_id']
        count = new_state.values.get('count', 0)
        lnode = new_state.values.get('lnode', "")
        rev = new_state.values.get('revision_number', 0)
        nnode = new_state.next
        return lnode, nnode, new_thread_ts, rev, count
    
    def update_thread_pd(self):
        return gr.Dropdown(label="choose thread", choices=self.threads, value=self.thread_id, interactive=True)
    
    def switch_thread(self, new_thread_id):
        self.thread = {"configurable": {"thread_id": str(new_thread_id)}}
        self.thread_id = new_thread_id
        return 
    
    def modify_state(self, key, asnode, new_state):
        try:
            print(f"\nModifying state: key={key}, asnode={asnode}")
            
            # Get current state
            try:
                current_values = self.graph.get_state(self.thread)
                print(f"Retrieved current state: {current_values}")
            except Exception as e:
                print(f"Error retrieving state: {e}")
                return
            
            # Validate state
            if not current_values or not hasattr(current_values, 'values'):
                print("No valid state values available")
                return
            
            # Map key names from GUI to agent
            key_map = {
                "design": "draft",  # Map "design" to "draft"
                "draft": "draft"    # Keep draft as draft
            }
            update_key = key_map.get(key, key)
            
            # Map node names from GUI to agent
            node_map = {
                "writer": "course designer",  # Map "writer" to "course designer"
                "course designer": "course designer"  # Keep course designer as is
            }
            update_node = node_map.get(asnode, asnode)
            
            print(f"Updating key '{update_key}' as node '{update_node}'")
            
            # Update the state and log
            try:
                # Create a copy of the values to avoid reference issues
                updated_values = dict(current_values.values)
                
                # Update the specific key
                updated_values[update_key] = new_state
                
                # Ensure all required keys exist
                required_keys = ["task", "plan", "draft", "critique", "revision_number", "max_revisions", "count", "lnode"]
                for req_key in required_keys:
                    if req_key not in updated_values:
                        # Use a default value or copy from current state
                        if req_key in current_values.values:
                            updated_values[req_key] = current_values.values[req_key]
                        else:
                            updated_values[req_key] = ""
                
                # Update the state
                self.graph.update_state(self.thread, updated_values, as_node=update_node)
                print(f"State updated successfully with values: {updated_values}")
                
            except Exception as e:
                print(f"Error updating state: {e}")
                
        except Exception as e:
            print(f"Error modifying state for {key}/{asnode}: {e}")
            return

    def create_interface(self):
        with gr.Blocks(theme=gr.themes.Default(spacing_size='sm', text_size="sm")) as demo:
            
            def updt_disp():
                try:
                    print("\nUpdating display...")
                    
                    # Default values
                    defaults = {
                        topic_bx: "",
                        lnode_bx: "",
                        count_bx: "",
                        revision_bx: "",
                        nnode_bx: "",
                        threadid_bx: self.thread_id,
                        thread_pd: gr.Dropdown(label="Choose Thread", choices=self.threads, 
                                               value=self.thread_id, interactive=True),
                        step_pd: gr.Dropdown(label="Select History Step", 
                                             choices=["N/A"], value="N/A", interactive=True),
                    }
                    
                    # Get current state
                    try:
                        current_state = self.graph.get_state(self.thread)
                        print(f"Retrieved current state: {current_state}")
                    except Exception as e:
                        print(f"Error getting current state: {e}")
                        return defaults
                    
                    # Build history dropdown
                    hist = []
                    try:
                        for state in self.graph.get_state_history(self.thread):
                            if not state or not hasattr(state, 'metadata') or not state.metadata or \
                               state.metadata.get('step', 0) < 1:
                                continue
                                
                            if not hasattr(state, 'config') or not state.config or \
                               'configurable' not in state.config:
                                continue
                                
                            s_thread_ts = state.config['configurable'].get('thread_ts', "unknown")
                            s_tid = state.config['configurable'].get('thread_id', "unknown")
                            
                            if not hasattr(state, 'values'):
                                continue
                                
                            s_count = state.values.get('count', 0)
                            s_lnode = state.values.get('lnode', "")
                            s_rev = state.values.get('revision_number', 0)
                            s_nnode = getattr(state, 'next', "")
                            
                            st = f"{s_tid}:{s_count}:{s_lnode}:{s_nnode}:{s_rev}:{s_thread_ts}"
                            hist.append(st)
                            print(f"Added history entry: {st}")
                    except Exception as e:
                        print(f"Error building history: {e}")
                    
                    # Check if we have a valid current state
                    if not current_state or not hasattr(current_state, 'values'):
                        print("No valid current state available")
                        if hist:
                            defaults[step_pd] = gr.Dropdown(label="Select History Step", 
                                                           choices=hist, value=hist[0], interactive=True)
                        return defaults
                    
                    # Update with current state values
                    try:
                        updates = {
                            topic_bx: current_state.values.get("task", ""),
                            lnode_bx: current_state.values.get("lnode", ""),
                            count_bx: str(current_state.values.get("count", 0)),
                            revision_bx: str(current_state.values.get("revision_number", 0)),
                            nnode_bx: str(getattr(current_state, 'next', "")),
                            threadid_bx: self.thread_id,
                            thread_pd: gr.Dropdown(label="Choose Thread", choices=self.threads, 
                                                   value=self.thread_id, interactive=True),
                        }
                        
                        if hist:
                            updates[step_pd] = gr.Dropdown(label="Select History Step", 
                                                          choices=hist, value=hist[0], interactive=True)
                        else:
                            updates[step_pd] = gr.Dropdown(label="Select History Step", 
                                                          choices=["N/A"], value="N/A", interactive=True)
                            
                        print(f"Updated values: {updates}")
                        return updates
                    except Exception as e:
                        print(f"Error creating updates: {e}")
                        if hist:
                            defaults[step_pd] = gr.Dropdown(label="Select History Step", 
                                                           choices=hist, value=hist[0], interactive=True)
                        return defaults
                        
                except Exception as e:
                    print(f"Critical error in updt_disp: {e}")
                    return {
                        topic_bx: "",
                        lnode_bx: "",
                        count_bx: "",
                        revision_bx: "",
                        nnode_bx: "",
                        threadid_bx: self.thread_id,
                        thread_pd: gr.Dropdown(label="Choose Thread", choices=self.threads, 
                                               value=self.thread_id, interactive=True),
                        step_pd: gr.Dropdown(label="Select History Step", 
                                             choices=["N/A"], value="N/A", interactive=True),
                    }
                    
            def get_snapshots():
                try:
                    new_label = f"thread_id: {self.thread_id}, Summary of snapshots"
                    sstate = ""
                    for state in self.graph.get_state_history(self.thread):
                        for key in ['plan', 'draft', 'critique']:
                            if key in state.values and state.values[key]:
                                state.values[key] = state.values[key][:80] + "..."
                        if 'writes' in state.metadata:
                            state.metadata['writes'] = "not shown"
                        sstate += str(state) + "\n\n"
                    return gr.update(label=new_label, value=sstate)
                except Exception as e:
                    print(f"Error getting snapshots: {e}")
                    return gr.update(label="Error getting snapshots", value=str(e))

            def vary_btn(stat):
                return(gr.update(variant=stat))
            
            with gr.Blocks(title="Course Designer") as interface:
                gr.Markdown("# Course Design Assistant")
        
            
            with gr.Tab("Agent"):
                gr.Markdown("""
                ## Application Controls
                
                **Getting Started:**
                1. Enter your course name in the field below
                2. Click "Generate Course Content" to start the design process
                3. After the planning stage completes, click "Continue Design Process"
                4. View results in the Plan, Design, and Critique tabs
                
                **Note:** The system follows a 3-stage workflow: Plan → Design → Critique.
                You can interrupt after any stage using the checkboxes below.
                """)
                with gr.Row():
                    topic_bx = gr.Textbox(label="Course Name", value="Transformations via Sustainable Development Goals x AI Mindset")
                    gen_btn = gr.Button("Generate Course Content", scale=0, min_width=80, variant='primary')
                    cont_btn = gr.Button("Continue Design Process", scale=0, min_width=80)
                with gr.Row():
                    lnode_bx = gr.Textbox(label="last node", min_width=100)
                    nnode_bx = gr.Textbox(label="next node", min_width=100)
                    threadid_bx = gr.Textbox(label="Thread", scale=0, min_width=80)
                    revision_bx = gr.Textbox(label="Draft Rev", scale=0, min_width=80)
                    count_bx = gr.Textbox(label="count", scale=0, min_width=80)
                with gr.Accordion("Manage Agent", open=False):
                    gr.Markdown("""
                    **Advanced Controls:**
                    
                    - **Interrupt After State**: Select which stages should pause the process
                    - **Select Thread**: Switch between different course designs
                    - **Select Step**: Restore the process to a previous point in time
                    
                    These controls allow for fine-grained management of the design process.
                    """)
                    checks = ["planner", "course designer", "reflect"]
                    stop_after = gr.CheckboxGroup(checks, label="Interrupt After State", value=checks, scale=0, min_width=400)
                    with gr.Row():
                        thread_pd = gr.Dropdown(choices=self.threads, interactive=True, label="Select Thread", min_width=120, scale=0)
                        step_pd = gr.Dropdown(choices=['N/A'], interactive=True, label="Select Step", min_width=160, scale=1)
                live = gr.Textbox(label="Live Agent Output", lines=5, max_lines=5)
        
                # actions
                sdisps = [topic_bx, lnode_bx, nnode_bx, threadid_bx, revision_bx, count_bx, step_pd, thread_pd]
                thread_pd.input(self.switch_thread, [thread_pd], None).then(
                                fn=updt_disp, inputs=None, outputs=sdisps)
                step_pd.input(self.copy_state, [step_pd], None).then(
                              fn=updt_disp, inputs=None, outputs=sdisps)
                gen_btn.click(vary_btn, gr.Number("secondary", visible=False), gen_btn).then(
                              fn=self.run_agent, inputs=[gr.Number(True, visible=False), topic_bx, stop_after], outputs=[live], show_progress=True).then(
                              fn=updt_disp, inputs=None, outputs=sdisps).then( 
                              vary_btn, gr.Number("primary", visible=False), gen_btn).then(
                              vary_btn, gr.Number("primary", visible=False), cont_btn)
                cont_btn.click(vary_btn, gr.Number("secondary", visible=False), cont_btn).then(
                               fn=self.run_agent, inputs=[gr.Number(False, visible=False), topic_bx, stop_after], 
                               outputs=[live]).then(
                               fn=updt_disp, inputs=None, outputs=sdisps).then(
                               vary_btn, gr.Number("primary", visible=False), cont_btn)
        
            with gr.Tab("Plan"):
                gr.Markdown("""
                ## Course Plan Editor
                
                This tab allows you to view and modify the course plan created by the AI.
                
                **Instructions:**
                1. Click "Refresh" to load the latest plan from the current state
                2. Make any desired changes to the plan content
                3. Click "Modify" to save your changes
                4. Return to the Agent tab and click "Continue Design Process" to proceed
                
                The plan typically includes an introduction and potential topic areas for the course.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                    modify_btn = gr.Button("Modify")
                plan = gr.Textbox(label="Plan", lines=10, interactive=True)
                refresh_btn.click(fn=self.get_state, inputs=gr.Number("plan", visible=False), outputs=plan)
                modify_btn.click(fn=self.modify_state, inputs=[gr.Number("plan", visible=False),
                                                          gr.Number("planner", visible=False), plan], outputs=None).then(
                                 fn=updt_disp, inputs=None, outputs=sdisps)
                                 
            with gr.Tab("Design"):
                gr.Markdown("""
                ## Course Content Editor
                
                This tab allows you to view and modify the course content created by the AI.
                
                **Instructions:**
                1. Click "Refresh" to load the latest course content
                2. Make any desired changes to the content
                3. Click "Modify" to save your changes
                4. Return to the Agent tab and click "Continue Design Process" to proceed to the critique
                
                The course content should incorporate the elements specified in the plan while focusing on 
                sustainable development, AI integration, and business service management concepts.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                    modify_btn = gr.Button("Modify")
                draft_bx = gr.Textbox(label="Design", lines=10, interactive=True)  # Label remains Design for UI consistency
                refresh_btn.click(fn=self.get_state, inputs=gr.Number("design", visible=False), outputs=draft_bx)
                modify_btn.click(fn=self.modify_state, inputs=[gr.Number("design", visible=False),
                                                          gr.Number("writer", visible=False), draft_bx], outputs=None).then(
                                fn=updt_disp, inputs=None, outputs=sdisps)
                                
            with gr.Tab("Critique"):
                gr.Markdown("""
                ## Course Critique Editor
                
                This tab displays the AI's evaluation of the course content, focusing on self-learning techniques,
                sustainable business practices, and AI integration.
                
                **Instructions:**
                1. Click "Refresh" to load the latest critique
                2. Review the critique for insights on how to improve the course
                3. You can modify the critique if needed, then click "Modify" to save
                4. Return to the Agent tab and click "Continue Design Process" to create a revised version
                
                The critique offers recommendations for improvement in content, structure, learning methods,
                and evaluation criteria for the course.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                    modify_btn = gr.Button("Modify")
                critique_bx = gr.Textbox(label="Critique", lines=10, interactive=True)
                refresh_btn.click(fn=self.get_state, inputs=gr.Number("critique", visible=False), outputs=critique_bx)
                modify_btn.click(fn=self.modify_state, inputs=[gr.Number("critique", visible=False),
                                                          gr.Number("reflect", visible=False), 
                                                          critique_bx], outputs=None).then(
                                fn=updt_disp, inputs=None, outputs=sdisps)
                                
            with gr.Tab("StateSnapShots"):
                gr.Markdown("""
                ## Process History Viewer
                
                This tab provides a technical view of the state changes throughout the course design process.
                
                **Instructions:**
                1. Click "Refresh" to load the history of all states
                2. Review the snapshots to track how the course developed over time
                
                This information can be helpful for debugging or understanding the design process flow.
                Each snapshot shows a summarized version of the agent's state at a particular point in time.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                snapshots = gr.Textbox(label="State Snapshots Summaries")
                refresh_btn.click(fn=get_snapshots, inputs=None, outputs=snapshots)
                
        return demo

    def launch(self, share=None):
        """
        Launch the Gradio interface.
        
        This function starts the web server for the Course Design Assistant.
        It prints a welcome message with basic instructions to the console.
        
        Parameters:
            share (bool, optional): Whether to create a shareable link. Defaults to None.
        """
        print("\n" + "="*80)
        print("COURSE DESIGN ASSISTANT")
        print("="*80)
        print("\nWelcome to the Course Design Assistant!")
        print("\nThis application helps you create educational course content using AI.")
        print("\nBasic Usage:")
        print("1. Enter a course name in the interface")
        print("2. Click 'Generate Course Content' to start")
        print("3. Navigate through the tabs to view and modify content")
        print("4. Use 'Continue Design Process' to progress through the workflow")
        print("\nThe application has opened in your web browser.")
        print("If not, please manually open the URL shown below.")
        print("="*80 + "\n")
        
        if port := os.getenv("PORT1"):
            self.demo.launch(share=True, server_port=int(port), server_name="0.0.0.0")
        else:
            self.demo.launch(share=self.share)
