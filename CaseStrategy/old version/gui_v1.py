import gradio as gr
import os
import json
import shutil
from pathlib import Path

class ESGProposalGUI:
    def __init__(self, graph, share=False, materials_dir="reference_materials", params_dir="proposal_parameters"):
        self.graph = graph
        self.share = share
        self.partial_message = ""
        self.response = {}
        self.max_iterations = 10
        self.iterations = []
        self.threads = []
        self.thread_id = -1
        self.thread = {"configurable": {"thread_id": str(self.thread_id)}}
        
        # Material uploader configuration
        self.materials_dir = Path(materials_dir)
        self.params_dir = Path(params_dir)
        
        # Create directories if they don't exist
        self.materials_dir.mkdir(exist_ok=True, parents=True)
        self.params_dir.mkdir(exist_ok=True, parents=True)
        
        # Sample parameter file if none exists
        self.create_sample_params()        
        
        self.demo = self.create_interface()

    def create_sample_params(self):
        """Create a sample parameters file if the directory is empty."""
        if not list(self.params_dir.glob("*.json")):
            sample_params = {
                "proposal_title": "ESG Transformation Strategy for Global Enterprises",
                "target_company": "Medium to Large Enterprise",
                "industry": "Manufacturing",
                "objective": "To develop a comprehensive ESG framework with actionable initiatives",
                "focus_areas": [
                    "Carbon footprint reduction",
                    "Supply chain sustainability",
                    "ESG reporting and transparency",
                    "Social impact programs"
                ]
            }
            
            with open(self.params_dir / "sample_parameters.json", 'w') as f:
                json.dump(sample_params, f, indent=4)
    
    # Material uploader methods
    def upload_file(self, files):
        """Upload files to the materials directory"""
        result = []
        for file in files:
            try:
                # Get the destination path
                dest_path = self.materials_dir / Path(file.name).name
                
                with gr.Accordion("Define New Parameters", open=True):
                    with gr.Group():
                        proposal_title = gr.Textbox(
                            label="Proposal Title",
                            placeholder="e.g., ESG Transformation Strategy for Retail Industry",
                            info="The main title of your ESG proposal"
                        )
                        
                        target_company = gr.Textbox(
                            label="Target Company",
                            placeholder="e.g., Mid-sized manufacturing company, Global enterprise",
                            info="What type of company is this proposal for?"
                        )
                        
                        with gr.Row():
                            industry = gr.Textbox(
                                label="Industry",
                                placeholder="e.g., Manufacturing, Technology, Healthcare",
                                info="What industry does the company operate in?"
                            )
                        
                        objective = gr.Textbox(
                            label="Primary Objective",
                            placeholder="e.g., to reduce carbon footprint by 30% within 3 years",
                            info="What is the main ESG goal?",
                            lines=2
                        )
                        
                        focus_areas = gr.Textbox(
                            label="ESG Focus Areas",
                            placeholder="e.g., Carbon footprint reduction, Supply chain sustainability, ESG reporting",
                            info="Comma-separated list of ESG focus areas",
                            lines=3
                        )
                    
                    with gr.Row():
                        save_params_btn = gr.Button("Save Parameters", variant="primary")
                        apply_params_btn = gr.Button("Apply to Current Proposal")
                    
                    save_result = gr.Textbox(label="Result", lines=2)
                
                # Set up parameter file events
                refresh_params_btn.click(
                    fn=lambda: gr.update(choices=self.list_parameter_files()),
                    inputs=[],
                    outputs=[param_files]
                )
                
                load_btn.click(
                    fn=self.load_parameters,
                    inputs=[param_files],
                    outputs=[params_display, topic_bx]
                )
                
                # New parameter save event
                def save_new_parameters(title, company, industry_type, obj, areas):
                    try:
                        # Process focus areas from string to list
                        areas_list = [area.strip() for area in areas.split(",") if area.strip()]
                        
                        # Create parameters dictionary
                        params = {
                            "proposal_title": title,
                            "target_company": company,
                            "industry": industry_type,
                            "objective": obj,
                            "focus_areas": areas_list
                        }
                        
                        # Generate filename
                        safe_title = "".join(c if c.isalnum() or c in [' ', '-', '_'] else '_' for c in title)
                        safe_title = safe_title.replace(' ', '_').lower()
                        filename = f"{safe_title}_parameters.json"
                        file_path = self.params_dir / filename
                        
                        # Save to JSON file
                        with open(file_path, 'w', encoding='utf-8') as f:
                            json.dump(params, f, indent=4)
                        
                        # Update dropdown choices
                        new_choices = self.list_parameter_files()
                        
                        return f"Parameters saved as {filename}", gr.update(choices=new_choices, value=filename)
                    except Exception as e:
                        return f"Error saving parameters: {e}", gr.update()
                
                save_params_btn.click(
                    fn=save_new_parameters,
                    inputs=[proposal_title, target_company, industry, objective, focus_areas],
                    outputs=[save_result, param_files]
                )
                
                # Apply parameters to current course
                def apply_parameters_to_proposal(title):
                    if title:
                        return title, "Parameters applied to proposal. Go to the Agent tab to generate content."
                    else:
                        return gr.update(), "No proposal title provided. Please define parameters first."
                
                apply_params_btn.click(
                    fn=apply_parameters_to_proposal,
                    inputs=[proposal_title],
                    outputs=[topic_bx, save_result]
                )
            except Exception as e:
                result.append(f"Error uploading {file.name}: {e}")
        
            return "\n".join(result)

    def list_files(self):
        """List all files in the materials directory"""
        files = []
        for file_path in self.materials_dir.glob("**/*"):
            if file_path.is_file():
                # Get the relative path to the materials directory
                rel_path = file_path.relative_to(self.materials_dir)
                files.append(str(rel_path))
        
        if not files:
            return "No files in the reference materials directory."
        
        return "\n".join(files)
    
    def delete_file(self, file_name):
        """Delete a file from the materials directory"""
        try:
            file_path = self.materials_dir / file_name
            
            if not file_path.exists():
                return f"File not found: {file_name}"
            
            # Delete the file
            file_path.unlink()
            
            return f"Successfully deleted: {file_name}"
        except Exception as e:
            return f"Error deleting {file_name}: {e}"

    # Parameter file methods
    def list_parameter_files(self):
        """List all parameter files available."""
        try:
            json_files = list(self.params_dir.glob("*.json"))
            return [file.name for file in json_files]
        except Exception:
            return ["Error listing parameter files"]
    
    def load_parameters(self, file_name):
        """Load parameters from a JSON file."""
        try:
            if not file_name:
                return ""
                
            file_path = self.params_dir / file_name
            
            with open(file_path, 'r') as f:
                params = json.load(f)
            
            # Format parameters for display
            display_text = f"Proposal Title: {params.get('proposal_title', 'N/A')}\n"
            display_text += f"Target Company: {params.get('target_company', 'N/A')}\n"
            display_text += f"Industry: {params.get('industry', 'N/A')}\n"
            display_text += f"Objective: {params.get('objective', 'N/A')}\n\n"
            display_text += "Focus Areas:\n"
            
            for i, area in enumerate(params.get('focus_areas', []), 1):
                display_text += f"{i}. {area}\n"
            
            # Also prepare topic text for the main input
            proposal_title = params.get('proposal_title', '')
            
            return display_text, proposal_title
        except Exception as e:
            return f"Error loading parameters: {e}", ""

    # Methods for agent execution
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
                    'count': 0,
                    'retrieved_docs': []  # Initialize empty retrieved docs
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
                "proposal": "draft",  # Map "proposal" to "draft"
                "materials": "retrieved_docs"  # Map "materials" to "retrieved_docs"
            }
            search_key = key_map.get(key, key)
            
            print(f"Searching for key: {search_key} in state")
            print(f"Available keys: {list(current_values.values.keys())}")
            
            # Debug the materials retrieval
            if key == "materials":
                print("Attempting to retrieve materials...")
                if "retrieved_docs" in current_values.values:
                    docs = current_values.values["retrieved_docs"]
                    print(f"Retrieved {len(docs) if isinstance(docs, list) else 'non-list'} documents")
                    print(f"Document type: {type(docs)}")
                    if isinstance(docs, list) and docs:
                        print(f"First document keys: {docs[0].keys() if hasattr(docs[0], 'keys') else 'No keys method'}")
            
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
                
                # Special handling for retrieved_docs
                if search_key == "retrieved_docs":
                    formatted_docs = ""
                    if isinstance(value, list):
                        if not value:
                            formatted_docs = "No reference materials were retrieved for this proposal topic."
                        else:
                            for i, doc in enumerate(value):
                                if isinstance(doc, dict):
                                    source = doc.get('source', 'Unknown')
                                    content = doc.get('content', 'No content available')
                                    formatted_docs += f"Document {i+1} - Source: {source}\n"
                                    formatted_docs += f"{content}\n\n"
                                else:
                                    formatted_docs += f"Document {i+1} - Unable to parse document format\n"
                    else:
                        formatted_docs = "Retrieved documents are not in the expected format."
                    
                    value = formatted_docs
                
                print(f"Returning value with label: {new_label}")
                return gr.update(label=new_label, value=value)
            else:
                if key == "materials" and "retrieved_docs" not in current_values.values:
                    return gr.update(
                        label="No Materials Retrieved",
                        value="No reference materials have been retrieved yet. Generate a proposal first by going to the Agent tab."
                    )
                
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
                "proposal": "draft",  # Map "proposal" to "draft"
                "draft": "draft",    # Keep draft as draft
                "materials": "retrieved_docs"  # Map "materials" to "retrieved_docs"
            }
            update_key = key_map.get(key, key)
            
            # Map node names from GUI to agent
            node_map = {
                "drafter": "drafter",  # Keep drafter as is
                "planner": "planner"  # Keep planner as is
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
                required_keys = ["task", "plan", "draft", "critique", "revision_number", "max_revisions", "count", "lnode", "retrieved_docs"]
                for req_key in required_keys:
                    if req_key not in updated_values:
                        # Use a default value or copy from current state
                        if req_key in current_values.values:
                            updated_values[req_key] = current_values.values[req_key]
                        else:
                            # Default values for different keys
                            if req_key == "retrieved_docs":
                                updated_values[req_key] = []
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
            # Define topic_bx at the beginning, before any tabs
            topic_bx = gr.Textbox(visible=False, value="ESG Transformation Strategy for Global Manufacturing")
            
            # Define these variables early to avoid scope issues
            lnode_bx = gr.Textbox(visible=False)
            nnode_bx = gr.Textbox(visible=False)
            threadid_bx = gr.Textbox(visible=False)
            revision_bx = gr.Textbox(visible=False)
            count_bx = gr.Textbox(visible=False)
            thread_pd = gr.Dropdown(visible=False)
            step_pd = gr.Dropdown(visible=False)
            
            # Define sdisps early to avoid scope issues
            sdisps = [topic_bx, lnode_bx, nnode_bx, threadid_bx, revision_bx, count_bx, step_pd, thread_pd]
        
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

            def vary_btn(stat):
                return(gr.update(variant=stat))
            
            with gr.Blocks(title="ESG Proposal Designer") as interface:
                gr.Markdown("# ESG Business Proposal Designer")
                
            with gr.Tab("Proposal Parameters"):
                gr.Markdown("""
                ## Proposal Parameters

                **Getting Started:**
                1. Define your ESG proposal parameters below
                2. You can choose from saved parameter files or create new ones
                3. After setting parameters, proceed to the Reference Materials tab to add supporting documents
                4. Then go to the Agent tab to generate your ESG proposal
                
                The parameters below will help the AI tailor the proposal content to your specific industry and ESG needs.
                """)
                
                with gr.Row():
                    with gr.Column(scale=2):
                        param_files = gr.Dropdown(
                            label="Load Saved Parameters",
                            choices=self.list_parameter_files(),
                            interactive=True
                        )
                        load_btn = gr.Button("Load Selected Parameters")
                    
                    with gr.Column(scale=1):
                        refresh_params_btn = gr.Button("Refresh Parameter List")
                
                params_display = gr.Textbox(
                    label="Parameter Summary",
                    lines=10,
                    interactive=False
                )

            with gr.Tab("Reference Materials"):
                gr.Markdown("""
                ## Reference Materials Upload
                
                **Getting Started:**
                1. Upload your reference materials in the tab below
                2. These materials will be used by the AI to create more relevant ESG proposals
                3. After uploading, proceed to the Agent tab to generate your proposal
                
                **Supported file types:**
                - Text files (.txt)
                - PDF files (.pdf)
                - Word documents (.doc, .docx)
                - HTML files (.html, .htm)
                - PowerPoint files (.ppt, .pptx)
                
                The AI will automatically incorporate these materials when designing your ESG proposal.
                """)
                
                with gr.Tab("Upload Materials"):
                    file_upload = gr.File(file_count="multiple", label="Upload Files")
                    upload_btn = gr.Button("Upload", variant="primary")
                    upload_result = gr.Textbox(label="Upload Result", lines=5)
                    
                    upload_btn.click(fn=self.upload_file, inputs=[file_upload], outputs=[upload_result])
                
                with gr.Tab("Manage Materials"):
                    refresh_btn = gr.Button("Refresh File List")
                    file_list = gr.Textbox(label="Available Files", lines=10)
                    
                    with gr.Row():
                        file_to_delete = gr.Textbox(label="File to Delete")
                        delete_btn = gr.Button("Delete", variant="stop")
                    
                    delete_result = gr.Textbox(label="Delete Result")
                    
                    refresh_btn.click(fn=self.list_files, inputs=[], outputs=[file_list])
                    delete_btn.click(fn=self.delete_file, inputs=[file_to_delete], outputs=[delete_result]).then(
                                  fn=self.list_files, inputs=[], outputs=[file_list])
            
            with gr.Tab("Agent"):
                gr.Markdown("""
                ## Proposal Generation Controls
                
                **Getting Started:**
                1. Make sure you've uploaded your reference materials in the Reference Materials tab
                2. Enter your proposal title in the field below
                3. Click "Generate ESG Proposal" to start the design process
                4. After the planning stage completes, click "Continue Development Process"
                5. Use the tabs below to view and edit the Plan, Proposal, and Feedback
                
                **Note:** The system follows a 3-stage workflow: Plan → Draft → Finalize.
                You can interrupt after any stage using the checkboxes below.
                """)
                
                with gr.Row():
                    topic_bx.update = gr.Textbox(label="Proposal Title", visible=True)
                    gen_btn = gr.Button("Generate ESG Proposal", scale=0, min_width=80, variant='primary')
                    cont_btn = gr.Button("Continue Development Process", scale=0, min_width=80)
                    
                with gr.Row():
                    lnode_bx = gr.Textbox(label="Last Node", min_width=100)
                    nnode_bx = gr.Textbox(label="Next Node", min_width=100)
                    threadid_bx = gr.Textbox(label="Thread", scale=0, min_width=80)
                    revision_bx = gr.Textbox(label="Draft Rev", scale=0, min_width=80)
                    count_bx = gr.Textbox(label="Count", scale=0, min_width=80)
                    
                with gr.Accordion("Manage Agent", open=False):
                    gr.Markdown("""
                    **Advanced Controls:**
                    
                    - **Interrupt After State**: Select which stages should pause the process
                    - **Select Thread**: Switch between different proposal designs
                    - **Select Step**: Restore the process to a previous point in time
                    
                    These controls allow for fine-grained management of the proposal development process.
                    """)
                    checks = ["planner", "drafter", "finalizer"]
                    stop_after = gr.CheckboxGroup(checks, label="Interrupt After State", value=checks, scale=0, min_width=400)
                    with gr.Row():
                        thread_pd = gr.Dropdown(choices=self.threads, interactive=True, label="Select Thread", min_width=120, scale=0)
                        step_pd = gr.Dropdown(choices=['N/A'], interactive=True, label="Select Step", min_width=160, scale=1)
                        
                live = gr.Textbox(label="Live Agent Output", lines=5, max_lines=5)
                    
                # Create nested tabs within the Agent tab for Plan, Proposal, and Feedback
                with gr.Tabs():
                    with gr.Tab("Plan"):
                        gr.Markdown("""
                        ## Proposal Plan Editor
                        
                        This tab allows you to view and modify the ESG proposal plan created by the AI.
                        
                        **Instructions:**
                        1. Click "Refresh" to load the latest plan from the current state
                        2. Make any desired changes to the plan content
                        3. Click "Modify" to save your changes
                        4. Return to the top controls and click "Continue Development Process" to proceed
                        
                        The plan typically includes an executive summary and potential sections for the ESG proposal.
                        """)
                        with gr.Row():
                            plan_refresh_btn = gr.Button("Refresh")
                            plan_modify_btn = gr.Button("Modify")
                        plan = gr.Textbox(label="Plan", lines=10, interactive=True)
                        plan_refresh_btn.click(fn=self.get_state, inputs=gr.Textbox(value="plan", visible=False), outputs=plan)
                        plan_modify_btn.click(fn=self.modify_state, inputs=[gr.Textbox(value="plan", visible=False),
                                                                  gr.Textbox(value="planner", visible=False), plan], outputs=None).then(
                                         fn=updt_disp, inputs=None, outputs=sdisps)
                                         
                    with gr.Tab("Proposal"):
                        gr.Markdown("""
                        ## Proposal Content Editor
                        
                        This tab allows you to view and modify the ESG proposal content created by the AI.
                        
                        **Instructions:**
                        1. Click "Refresh" to load the latest proposal content
                        2. Make any desired changes to the content
                        3. Click "Modify" to save your changes
                        4. Return to the top controls and click "Continue Development Process" to proceed to finalization
                        
                        The proposal content should incorporate the elements specified in the plan while focusing on 
                        environmental, social, and governance improvements with practical implementation steps.
                        """)
                        with gr.Row():
                            draft_refresh_btn = gr.Button("Refresh")
                            draft_modify_btn = gr.Button("Modify")
                        draft_bx = gr.Textbox(label="Proposal", lines=10, interactive=True)
                        draft_refresh_btn.click(fn=self.get_state, inputs=gr.Textbox(value="proposal", visible=False), outputs=draft_bx)
                        draft_modify_btn.click(fn=self.modify_state, inputs=[gr.Textbox(value="proposal", visible=False),
                                                                  gr.Textbox(value="drafter", visible=False), draft_bx], outputs=None).then(
                                        fn=updt_disp, inputs=None, outputs=sdisps)
                                        
                    with gr.Tab("Feedback"):
                        gr.Markdown("""
                        ## Proposal Feedback Editor
                        
                        This tab displays the AI's evaluation of the ESG proposal, focusing on environmental impact, 
                        social responsibility, governance improvements, and practical implementation steps.
                        
                        **Instructions:**
                        1. Click "Refresh" to load the latest feedback
                        2. Review the feedback for insights on how to improve the proposal
                        3. You can modify the feedback if needed, then click "Modify" to save
                        4. Return to the top controls and click "Continue Development Process" to create a revised version
                        
                        The feedback offers recommendations for improvement in content, structure, implementation steps,
                        and metrics for measuring ESG success.
                        """)
                        with gr.Row():
                            critique_refresh_btn = gr.Button("Refresh")
                            critique_modify_btn = gr.Button("Modify")
                        critique_bx = gr.Textbox(label="Feedback", lines=10, interactive=True)
                        critique_refresh_btn.click(fn=self.get_state, inputs=gr.Textbox(value="critique", visible=False), outputs=critique_bx)
                        critique_modify_btn.click(fn=self.modify_state, inputs=[gr.Textbox(value="critique", visible=False),
                                                                  gr.Textbox(value="finalizer", visible=False),
                                                                  critique_bx], outputs=None).then(
                                        fn=updt_disp, inputs=None, outputs=sdisps)
                
                # actions for Agent tab buttons
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
            
            with gr.Tab("Used Materials"):
                gr.Markdown("""
                ## Reference Materials Viewer
                
                This tab displays the reference materials that were retrieved and referenced during the proposal planning.
                
                **Instructions:**
                1. Add your reference materials using the Reference Materials tab
                2. Click "Refresh" to load the materials that were used for this proposal
                3. Review the content to see what information was incorporated
                
                The retrieved materials are used by the AI to create more contextually relevant ESG proposals.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                    materials_box = gr.Textbox(label="Retrieved Reference Materials", lines=15, max_lines=30, interactive=False)
                
                refresh_btn.click(
                    fn=lambda x: print(f"Materials refresh clicked with input: {x}") or self.get_state(x),
                    inputs=[gr.Textbox(value="materials", visible=False)],
                    outputs=[materials_box]
                )
                  
            with gr.Tab("State History"):
                gr.Markdown("""
                ## Process History Viewer
                
                This tab provides a technical view of the state changes throughout the proposal development process.
                
                **Instructions:**
                1. Click "Refresh" to load the history of all states
                2. Review the snapshots to track how the proposal developed over time
                
                This information can be helpful for debugging or understanding the development process flow.
                Each snapshot shows a summarized version of the agent's state at a particular point in time.
                """)
                with gr.Row():
                    refresh_btn = gr.Button("Refresh")
                snapshots = gr.Textbox(label="State Snapshots Summaries")
                refresh_btn.click(fn=get_snapshots, inputs=None, outputs=snapshots)
                
            with gr.Tab("Export Proposal"):
                gr.Markdown("""
                ## Export ESG Proposal
                
                Use this tab to export your finalized ESG proposal as a structured table for presentation.
                
                **Export Format:**
                - Title: The proposal title
                - Target Company: The company type this proposal is for
                - Objective: The main ESG goal of the proposal
                - Approach: The implementation approach
                - Key Initiatives: List of specific ESG initiatives
                - Success Metrics: Metrics to measure ESG success
                - Timeline: Implementation timeline
                - Budget: Estimated costs and investments
                
                **Instructions:**
                1. First, complete the proposal development in the Agent tab
                2. Click "Generate Preview" to see how your export will look
                3. Choose your preferred export format (CSV or Excel)
                4. Click the export button to download the summary
                """)
                
                with gr.Row():
                    preview_btn = gr.Button("Generate Preview", variant="primary")
                    
                preview_html = gr.HTML(label="Preview", value="<p>Click 'Generate Preview' to see your proposal summary.</p>")
                
                with gr.Row():
                    with gr.Column():
                        csv_btn = gr.Button("Export as CSV")
                        excel_btn = gr.Button("Export as Excel")
                    
                    export_result = gr.Textbox(label="Export Result", lines=2)
                
                # Initialize the proposal exporter
                from project_designer import ProposalExporter
                exporter = ProposalExporter()
                
                # Function to generate preview
                def generate_preview():
                    try:
                        # Get current state
                        current_state = self.graph.get_state(self.thread)
                        
                        # Check if we have a valid state
                        if not current_state or not hasattr(current_state, 'values'):
                            return "<p>Error: No proposal has been generated yet. Please generate a proposal first.</p>"
                        
                        # Get draft and plan content
                        draft = current_state.values.get("draft", "")
                        plan = current_state.values.get("plan", "")
                        
                        if not draft:
                            return "<p>Error: No proposal content found. Please complete the proposal development first.</p>"
                        
                        # Try to find parameter file (optional)
                        param_file = None
                        for file in Path("proposal_parameters").glob("*.json"):
                            with open(file, 'r') as f:
                                params = json.load(f)
                                if params.get("proposal_title", "") in draft:
                                    param_file = file
                                    break
                        
                        # Extract proposal data
                        if param_file:
                            params = exporter.load_parameters(param_file)
                            proposal_data = exporter.extract_proposal_data(draft, plan, params)
                        else:
                            proposal_data = exporter.extract_proposal_data(draft, plan)
                        
                        # Generate HTML preview
                        html_table = exporter.generate_html_table(proposal_data)
                        
                        # Store proposal data for export functions
                        self.current_proposal_data = proposal_data
                        
                        return html_table
                    except Exception as e:
                        return f"<p>Error generating preview: {str(e)}</p>"
                
                # Function to export as CSV
                def export_csv():
                    try:
                        if not hasattr(self, 'current_proposal_data'):
                            return "Please generate a preview first."
                        
                        file_path = exporter.export_to_csv(self.current_proposal_data)
                        return f"Proposal exported successfully to {file_path}"
                    except Exception as e:
                        return f"Error exporting to CSV: {str(e)}"
                
                # Function to export as Excel
                def export_excel():
                    try:
                        if not hasattr(self, 'current_proposal_data'):
                            return "Please generate a preview first."
                        
                        file_path = exporter.export_to_xlsx(self.current_proposal_data)
                        return f"Proposal exported successfully to {file_path}"
                    except Exception as e:
                        return f"Error exporting to Excel: {str(e)}"
                
                # Connect event handlers
                preview_btn.click(fn=generate_preview, inputs=[], outputs=[preview_html])
                csv_btn.click(fn=export_csv, inputs=[], outputs=[export_result])
                excel_btn.click(fn=export_excel, inputs=[], outputs=[export_result])
                
        return demo

    def launch(self, share=None):
        """
        Launch the Gradio interface.
        
        This function starts the web server for the ESG Proposal Designer.
        It prints a welcome message with basic instructions to the console.
        
        Parameters:
            share (bool, optional): Whether to create a shareable link. Defaults to None.
        """
        print("\n" + "="*80)
        print("ESG BUSINESS PROPOSAL DESIGNER")
        print("="*80)
        print("\nWelcome to the ESG Business Proposal Designer!")
        print("\nThis application helps you create compelling ESG proposals using AI and your reference materials.")
        print("\nBasic Usage:")
        print("1. First, upload your reference materials in the Reference Materials tab")
        print("2. Enter a proposal title in the Agent tab")
        print("3. Click 'Generate ESG Proposal' to start")
        print("4. Navigate through the tabs to view and modify content")
        print("5. Use 'Continue Development Process' to progress through the workflow")
        print("6. Check the 'Materials' tab to see which documents were referenced")
        print("\nThe application has opened in your web browser.")
        print("If not, please manually open the URL shown below.")
        print("="*80 + "\n")
        
        if port := os.getenv("PORT1"):
            self.demo.launch(share=True, server_port=int(port), server_name="0.0.0.0")
        else:
            self.demo.launch(share=self.share)


# Usage example
if __name__ == "__main__":
    from project_designer import ESGProposalDesigner
    
    # Initialize the ESG proposal designer with the reference materials directory
    proposal_designer = ESGProposalDesigner(materials_dir="reference_materials")
    
    # Initialize and launch the GUI with reference material upload functionality
    app = ESGProposalGUI(proposal_designer.graph, materials_dir="reference_materials")
    app.launch()
