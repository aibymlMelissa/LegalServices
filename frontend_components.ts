// types/course.ts
export interface CourseParameters {
  course_title: string;
  target_audience: string;
  teaching_style: string;
  teaching_objective: string;
  compulsory_areas: string[];
}

export interface AgentState {
  task: string;
  lnode: string;
  plan: string;
  draft: string;
  critique: string;
  revision_number: number;
  max_revisions: number;
  count: number;
  retrieved_docs?: RetrievedDocument[];
}

export interface RetrievedDocument {
  content: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface CourseData {
  title: string;
  teaching_goal: string;
  teaching_method: string;
  topics: string[];
  references: string[];
}

export interface AgentResponse {
  live_output: string;
  lnode: string;
  nnode: string;
  thread_id: number;
  revision: number;
  count: number;
}

// components/CourseParametersComponent.tsx
import React, { useState, useEffect } from 'react';
import { CourseParameters } from '../types/course';
import { courseParametersService } from '../services/courseParametersService';

interface CourseParametersComponentProps {
  onParametersChange: (params: CourseParameters) => void;
}

export const CourseParametersComponent: React.FC<CourseParametersComponentProps> = ({
  onParametersChange
}) => {
  const [parameters, setParameters] = useState<CourseParameters>({
    course_title: '',
    target_audience: '',
    teaching_style: '',
    teaching_objective: '',
    compulsory_areas: []
  });
  
  const [parameterFiles, setParameterFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [paramsSummary, setParamsSummary] = useState<string>('');

  useEffect(() => {
    loadParameterFiles();
  }, []);

  const loadParameterFiles = async () => {
    try {
      const files = await courseParametersService.listParameterFiles();
      setParameterFiles(files);
    } catch (error) {
      console.error('Error loading parameter files:', error);
    }
  };

  const loadSelectedParameters = async () => {
    if (!selectedFile) return;
    
    try {
      const params = await courseParametersService.loadParameters(selectedFile);
      setParameters(params);
      setParamsSummary(formatParametersSummary(params));
    } catch (error) {
      console.error('Error loading parameters:', error);
    }
  };

  const saveParameters = async () => {
    try {
      const filename = await courseParametersService.saveParameters(parameters);
      await loadParameterFiles();
      setSelectedFile(filename);
      alert(`Parameters saved as ${filename}`);
    } catch (error) {
      console.error('Error saving parameters:', error);
      alert('Error saving parameters');
    }
  };

  const applyParameters = () => {
    onParametersChange(parameters);
  };

  const formatParametersSummary = (params: CourseParameters): string => {
    return `Course Title: ${params.course_title}
Target Audience: ${params.target_audience}
Teaching Style: ${params.teaching_style}
Teaching Objective: ${params.teaching_objective}

Compulsory Knowledge Areas:
${params.compulsory_areas.map((area, index) => `${index + 1}. ${area}`).join('\n')}`;
  };

  const handleCompulsoryAreasChange = (value: string) => {
    const areas = value.split(',').map(area => area.trim()).filter(area => area);
    setParameters({ ...parameters, compulsory_areas: areas });
  };

  return (
    <div className="course-parameters">
      <div className="parameters-loader">
        <h3>Load Saved Parameters</h3>
        <div className="flex gap-2">
          <select 
            value={selectedFile} 
            onChange={(e) => setSelectedFile(e.target.value)}
            className="flex-1 p-2 border rounded"
          >
            <option value="">Select parameter file...</option>
            {parameterFiles.map(file => (
              <option key={file} value={file}>{file}</option>
            ))}
          </select>
          <button onClick={loadSelectedParameters} className="btn btn-secondary">
            Load Parameters
          </button>
          <button onClick={loadParameterFiles} className="btn btn-outline">
            Refresh
          </button>
        </div>
        
        {paramsSummary && (
          <textarea 
            value={paramsSummary} 
            readOnly 
            rows={10}
            className="w-full mt-2 p-2 border rounded bg-gray-50"
          />
        )}
      </div>

      <div className="parameters-form mt-6">
        <h3>Define New Parameters</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Title</label>
            <input
              type="text"
              value={parameters.course_title}
              onChange={(e) => setParameters({ ...parameters, course_title: e.target.value })}
              placeholder="e.g., Business Innovation and Sustainability"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Audience</label>
            <input
              type="text"
              value={parameters.target_audience}
              onChange={(e) => setParameters({ ...parameters, target_audience: e.target.value })}
              placeholder="e.g., master students, working professionals"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teaching Style</label>
            <input
              type="text"
              value={parameters.teaching_style}
              onChange={(e) => setParameters({ ...parameters, teaching_style: e.target.value })}
              placeholder="e.g., friendly, formal, interactive"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teaching Objective</label>
            <textarea
              value={parameters.teaching_objective}
              onChange={(e) => setParameters({ ...parameters, teaching_objective: e.target.value })}
              placeholder="e.g., to prepare students for management roles in the 21st century"
              rows={2}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Compulsory Knowledge Areas</label>
            <textarea
              value={parameters.compulsory_areas.join(', ')}
              onChange={(e) => handleCompulsoryAreasChange(e.target.value)}
              placeholder="e.g., Business Service Management, Sustainable Development Goals, Environmental Social Governance"
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={saveParameters} className="btn btn-primary">
              Save Parameters
            </button>
            <button onClick={applyParameters} className="btn btn-secondary">
              Apply to Current Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// components/MaterialUploadComponent.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { materialService } from '../services/materialService';

export const MaterialUploadComponent: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<string>('');
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const result = await materialService.uploadFiles(formData);
      setUploadResult(result);
      await refreshFileList();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult('Error uploading files');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    }
  });

  const refreshFileList = async () => {
    try {
      const files = await materialService.listFiles();
      setFileList(files);
    } catch (error) {
      console.error('Error refreshing file list:', error);
    }
  };

  const deleteFile = async () => {
    if (!selectedFileToDelete) return;

    try {
      const result = await materialService.deleteFile(selectedFileToDelete);
      setUploadResult(result);
      await refreshFileList();
      setSelectedFileToDelete('');
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadResult('Error deleting file');
    }
  };

  React.useEffect(() => {
    refreshFileList();
  }, []);

  return (
    <div className="material-upload">
      <div className="upload-section">
        <h3>Upload Teaching Materials</h3>
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div>
                <p>Drag & drop files here, or click to select files</p>
                <p className="text-sm text-gray-500">
                  Supported: PDF, DOCX, TXT, HTML, PPTX
                </p>
              </div>
            )}
          </div>
        </div>

        {uploadResult && (
          <div className="upload-result mt-4 p-3 bg-gray-100 rounded">
            <pre>{uploadResult}</pre>
          </div>
        )}
      </div>

      <div className="file-management mt-6">
        <h3>Manage Materials</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={refreshFileList} className="btn btn-secondary">
            Refresh File List
          </button>
        </div>

        <div className="file-list">
          {fileList.length === 0 ? (
            <p>No files in the materials directory.</p>
          ) : (
            <div className="space-y-2">
              {fileList.map(file => (
                <div key={file} className="flex items-center justify-between p-2 border rounded">
                  <span>{file}</span>
                  <button 
                    onClick={() => setSelectedFileToDelete(file)}
                    className="btn btn-sm btn-danger"
                  >
                    Select for Deletion
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFileToDelete && (
          <div className="delete-section mt-4 p-3 border border-red-300 rounded">
            <p>Selected for deletion: <strong>{selectedFileToDelete}</strong></p>
            <div className="flex gap-2 mt-2">
              <button onClick={deleteFile} className="btn btn-danger">
                Confirm Delete
              </button>
              <button 
                onClick={() => setSelectedFileToDelete('')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// components/CourseAgentComponent.tsx
import React, { useState, useEffect } from 'react';
import { AgentState, AgentResponse } from '../types/course';
import { courseAgentService } from '../services/courseAgentService';

export const CourseAgentComponent: React.FC = () => {
  const [courseName, setCourseName] = useState<string>('Transformations via Sustainable Development Goals x AI Mindset');
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [liveOutput, setLiveOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [stopAfter, setStopAfter] = useState<string[]>(['planner', 'course designer', 'reflect']);
  
  // State content
  const [plan, setPlan] = useState<string>('');
  const [design, setDesign] = useState<string>('');
  const [critique, setCritique] = useState<string>('');

  const startGeneration = async () => {
    setIsGenerating(true);
    try {
      const response = await courseAgentService.runAgent({
        start: true,
        topic: courseName,
        stopAfter
      });
      
      // Handle streaming response
      handleAgentResponse(response);
    } catch (error) {
      console.error('Error starting generation:', error);
      setLiveOutput('Error occurred during course generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const continueGeneration = async () => {
    setIsGenerating(true);
    try {
      const response = await courseAgentService.runAgent({
        start: false,
        topic: courseName,
        stopAfter
      });
      
      handleAgentResponse(response);
    } catch (error) {
      console.error('Error continuing generation:', error);
      setLiveOutput('Error occurred during course generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAgentResponse = (response: AgentResponse) => {
    setLiveOutput(response.live_output);
    setAgentState({
      task: courseName,
      lnode: response.lnode,
      plan: '',
      draft: '',
      critique: '',
      revision_number: response.revision,
      max_revisions: 2,
      count: response.count,
      retrieved_docs: []
    });
  };

  const refreshState = async (stateKey: 'plan' | 'design' | 'critique') => {
    try {
      const content = await courseAgentService.getState(stateKey);
      switch (stateKey) {
        case 'plan':
          setPlan(content);
          break;
        case 'design':
          setDesign(content);
          break;
        case 'critique':
          setCritique(content);
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${stateKey}:`, error);
    }
  };

  const modifyState = async (stateKey: 'plan' | 'design' | 'critique', content: string) => {
    try {
      const nodeMap = {
        plan: 'planner',
        design: 'course designer',
        critique: 'reflect'
      };
      
      await courseAgentService.modifyState(stateKey, nodeMap[stateKey], content);
    } catch (error) {
      console.error(`Error modifying ${stateKey}:`, error);
    }
  };

  return (
    <div className="course-agent">
      <div className="agent-controls">
        <div className="course-input mb-4">
          <label className="block text-sm font-medium mb-2">Course Name</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isGenerating}
          />
        </div>

        <div className="action-buttons mb-4">
          <div className="flex gap-2">
            <button 
              onClick={startGeneration}
              disabled={isGenerating || !courseName}
              className="btn btn-primary"
            >
              {isGenerating ? 'Generating...' : 'Generate Course Content'}
            </button>
            <button 
              onClick={continueGeneration}
              disabled={isGenerating}
              className="btn btn-secondary"
            >
              Continue Design Process
            </button>
          </div>
        </div>

        <div className="status-info grid grid-cols-5 gap-2 mb-4">
          <div>
            <label className="block text-xs font-medium">Last Node</label>
            <input 
              value={agentState?.lnode || ''} 
              readOnly 
              className="w-full p-1 text-xs border rounded bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Thread ID</label>
            <input 
              value="0" 
              readOnly 
              className="w-full p-1 text-xs border rounded bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Revision</label>
            <input 
              value={agentState?.revision_number || 0} 
              readOnly 
              className="w-full p-1 text-xs border rounded bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Count</label>
            <input 
              value={agentState?.count || 0} 
              readOnly 
              className="w-full p-1 text-xs border rounded bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Stop After</label>
            <select 
              multiple 
              value={stopAfter} 
              onChange={(e) => setStopAfter(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full p-1 text-xs border rounded"
            >
              <option value="planner">Planner</option>
              <option value="course designer">Course Designer</option>
              <option value="reflect">Reflect</option>
            </select>
          </div>
        </div>

        <div className="live-output mb-4">
          <label className="block text-sm font-medium mb-2">Live Agent Output</label>
          <textarea
            value={liveOutput}
            readOnly
            rows={5}
            className="w-full p-2 border rounded bg-gray-50 text-xs font-mono"
          />
        </div>
      </div>

      <div className="state-editors">
        <div className="tabs">
          <div className="tab-content">
            {/* Plan Tab */}
            <div className="state-section mb-6">
              <h3>Course Plan Editor</h3>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => refreshState('plan')}
                  className="btn btn-secondary btn-sm"
                >
                  Refresh Plan
                </button>
                <button 
                  onClick={() => modifyState('plan', plan)}
                  className="btn btn-primary btn-sm"
                >
                  Modify Plan
                </button>
              </div>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={10}
                className="w-full p-3 border rounded"
                placeholder="Plan content will appear here after generation..."
              />
            </div>

            {/* Design Tab */}
            <div className="state-section mb-6">
              <h3>Course Content Editor</h3>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => refreshState('design')}
                  className="btn btn-secondary btn-sm"
                >
                  Refresh Design
                </button>
                <button 
                  onClick={() => modifyState('design', design)}
                  className="btn btn-primary btn-sm"
                >
                  Modify Design
                </button>
              </div>
              <textarea
                value={design}
                onChange={(e) => setDesign(e.target.value)}
                rows={10}
                className="w-full p-3 border rounded"
                placeholder="Course design content will appear here after generation..."
              />
            </div>

            {/* Critique Tab */}
            <div className="state-section">
              <h3>Course Critique Editor</h3>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => refreshState('critique')}
                  className="btn btn-secondary btn-sm"
                >
                  Refresh Critique
                </button>
                <button 
                  onClick={() => modifyState('critique', critique)}
                  className="btn btn-primary btn-sm"
                >
                  Modify Critique
                </button>
              </div>
              <textarea
                value={critique}
                onChange={(e) => setCritique(e.target.value)}
                rows={10}
                className="w-full p-3 border rounded"
                placeholder="Course critique will appear here after reflection..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// components/CourseExportComponent.tsx
import React, { useState } from 'react';
import { CourseData } from '../types/course';
import { courseExportService } from '../services/courseExportService';

export const CourseExportComponent: React.FC = () => {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [exportResult, setExportResult] = useState<string>('');

  const generatePreview = async () => {
    try {
      const data = await courseExportService.extractCourseData();
      setCourseData(data);
      
      const html = generateTableHtml(data);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewHtml('<p>Error generating preview. Please generate a course first.</p>');
    }
  };

  const downloadCsv = async () => {
    if (!courseData) {
      setExportResult('Please generate a preview first.');
      return;
    }

    try {
      const blob = await courseExportService.exportToCsv(courseData);
      downloadBlob(blob, `${courseData.title.replace(/\s+/g, '_').toLowerCase()}_table.csv`);
      setExportResult('CSV file downloaded successfully.');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setExportResult('Error downloading CSV file.');
    }
  };

  const downloadExcel = async () => {
    if (!courseData) {
      setExportResult('Please generate a preview first.');
      return;
    }

    try {
      const blob = await courseExportService.exportToExcel(courseData);
      downloadBlob(blob, `${courseData.title.replace(/\s+/g, '_').toLowerCase()}_table.xlsx`);
      setExportResult('Excel file downloaded successfully.');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setExportResult('Error downloading Excel file.');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateTableHtml = (data: CourseData): string => {
    return `
      <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <tr>
          <th colspan="2" style="padding: 8px; text-align: center; background-color: #4CAF50; color: white; font-size: 16px;">
            Course Design Table
          </th>
        </tr>
        <tr>
          <th style="width: 20%; padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Title</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${data.title}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Goal</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${data.teaching_goal}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Teaching Method</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${data.teaching_method}</td>
        </tr>
        <tr>
          <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">Course Content</th>
        </tr>
        ${data.topics.map((topic, index) => `
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Topic ${index + 1}</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${topic}</td>
        </tr>
        `).join('')}
        ${data.references.length > 0 ? `
        <tr>
          <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f2f2f2;">References</th>
        </tr>
        ${data.references.map((ref, index) => `
        <tr>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;">Reference ${index + 1}</th>
          <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${ref}</td>
        </tr>
        `).join('')}
        ` : ''}
      </table>
    `;
  };

  return (
    <div className="course-export">
      <div className="export-controls mb-4">
        <button 
          onClick={generatePreview}
          className="btn btn-primary mr-2"
        >
          Generate Table Preview
        </button>
      </div>

      <div className="preview-section mb-4">
        <h3>Preview</h3>
        <div 
          className="border rounded p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: previewHtml || '<p>Click "Generate Table Preview" to see your course table.</p>' }}
        />
      </div>

      <div className="download-section">
        <h3>Download Options</h3>
        <div className="flex gap-2 mb-2">
          <button onClick={downloadCsv} className="btn btn-secondary">
            Download as CSV
          </button>
          <button onClick={downloadExcel} className="btn btn-secondary">
            Download as Excel
          </button>
        </div>
        
        {exportResult && (
          <div className="export-result p-2 bg-gray-100 rounded">
            {exportResult}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
import React, { useState } from 'react';
import { CourseParameters } from './types/course';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('parameters');
  const [courseParameters, setCourseParameters] = useState<CourseParameters | null>(null);

  const tabs = [
    { id: 'parameters', label: 'Course Parameters' },
    { id: 'materials', label: 'Material Upload' },
    { id: 'agent', label: 'Agent' },
    { id: 'export', label: 'Export Course' }
  ];

  return (
    <div className="app">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Course Design Assistant</h1>
      </header>

      <nav className="border-b">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {activeTab === 'parameters' && (
          <CourseParametersComponent onParametersChange={setCourseParameters} />
        )}
        {activeTab === 'materials' && <MaterialUploadComponent />}
        {activeTab === 'agent' && <CourseAgentComponent />}
        {activeTab === 'export' && <CourseExportComponent />}
      </main>
    </div>
  );
};