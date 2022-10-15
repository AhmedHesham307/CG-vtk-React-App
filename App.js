import { useState, useRef, useEffect } from 'react';
import { vec3, quat, mat4 } from 'gl-matrix';

import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';


import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseGaussianWidget from '@kitware/vtk.js/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkImageCroppingWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';


const head = 'https://kitware.github.io/vtk-js/data/volume/headsq.vti';
const trunk = 'https://kitware.github.io/vtk-js/data/volume/LIDC2.vti';

    
function App() {

    const [page,setPage] = useState(0)
    const [pageLink,setPageLink]= useState('')
// -----------------------------------------------------------
// Surface rendring section
// -----------------------------------------------------------
    let Isochange = ({link}) => {
      const vtkContainerRef = useRef(null);
    
      useEffect(() => {
        
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
          rootContainer: vtkContainerRef.current,
          background: [0.6, 0.7, 0.74],
        });
          const renderer = fullScreenRenderer.getRenderer();
          const renderWindow = fullScreenRenderer.getRenderWindow();
          
          const marchingCube = vtkImageMarchingCubes.newInstance({
            contourValue: 0.0,
            computeNormals: true,
            mergePoints: true,
          });
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();
    
          actor.setMapper(mapper);
          mapper.setInputConnection(marchingCube.getOutputPort());

          function updateIsoValue(e) {
            const isoValue = Number(e.target.value);
            marchingCube.setContourValue(isoValue);
            renderWindow.render();
        }
    
          renderer.addActor(actor);
          renderer.resetCamera();
          renderWindow.render();
          const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
          marchingCube.setInputConnection(reader.getOutputPort());

          const localStorage = window.localStorage;

          var dataRange = JSON.parse(localStorage.getItem('data_range'));
          var isoValue = localStorage.getItem('iso_value');

        const loadDataFromRemoteSource = (dataRange == null || isoValue == null)
        reader
        .setUrl(link, { loadData: true })
        .then(() => {
          if (loadDataFromRemoteSource) {
            const data = reader.getOutputData();
            dataRange = data.getPointData().getScalars().getRange();
            isoValue = (dataRange[0] + dataRange[1]) / 3;

            localStorage.setItem('data_range', JSON.stringify(dataRange));
            localStorage.setItem('iso_value', isoValue);
          }

            const el = document.querySelector('.isoValue');
                el.setAttribute('min', dataRange[0]);
                el.setAttribute('max', dataRange[1]);
                el.setAttribute('value', isoValue);
                el.addEventListener('input', updateIsoValue);
    
              marchingCube.setContourValue(isoValue);
              renderer.addActor(actor);
              renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
              renderer.resetCamera();
              renderWindow.render();
          });
          
          var element1 = document.getElementById("gaussian");
          var element2 = document.getElementById("lblgaussian");
    
          if (typeof (element1) != 'undefined' && element1 != null) {
              element1.parentNode.removeChild(element1);
          }
    
          if (typeof (element2) != 'undefined' && element2 != null) {
              element2.parentNode.removeChild(element2);
          }
      }, [vtkContainerRef , link]);

    return (
        < >
          <div ref={vtkContainerRef} />
          <table style={{
              position: 'absolute',
              top: '25px',
              left: '25px',
              background: 'rgb(102, 100, 165)',
              color: 'beige',
              padding: '12px',
              borderRadius: '5px',
          }}>
            <tbody>
              <tr>
                <td>iso-value</td>
                <td>
                    <input 
                    class="isoValue"
                    type="range" 
                    min="0.0" 
                    max="3926" 
                    step="0.05"  
                    onChange={e=>{localStorage.setItem('iso_value', e.target.value)}}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </>
    );}

// -----------------------------------------------------------
// Ray casting section
// -----------------------------------------------------------
      
      let Gaussian = ({link}) =>{
        const vtkContainerRef = useRef(null);
        const rootContainer = document.querySelector(
        '.vtk-js-example-piecewise-gaussian-widget'
        );
        const containerStyle = rootContainer ? { height: '100%' } : null;
        const urlToLoad = link;
        useEffect(() => {
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            rootContainer: vtkContainerRef.current,
            background: [0.6, 0.7, 0.74],
        });
        const renderer = fullScreenRenderer.getRenderer();
        const renderWindow = fullScreenRenderer.getRenderWindow();
    
        renderWindow.getInteractor().setDesiredUpdateRate(15.0);
    
        // ----------------------------------------------------------------------------
        // Example code
        // ----------------------------------------------------------------------------
    
        const body = rootContainer || document.querySelector('body');
    
        // Create Widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = "gaussian";
        widgetContainer.style.position = 'absolute';
        widgetContainer.style.top = 'calc(40px + 1em)';
        widgetContainer.style.left = '5px';
        widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
        body.appendChild(widgetContainer);
    
        // Create Label for preset
        const labelContainer = document.createElement('div');
        labelContainer.id = "lblgaussian";
        labelContainer.style.position = 'absolute';
        labelContainer.style.paddingLeft = '10px';
        labelContainer.style.paddingRight = '10px';
        labelContainer.style.paddingBottom = '5px';
        labelContainer.style.paddingTop = '5px';
        labelContainer.style.top = '5px';
        labelContainer.style.left = '150px';
        labelContainer.style.background = 'rgb(102, 100, 165)';
        labelContainer.style.borderRadius = '100px';
        labelContainer.style.color = 'beige';
        labelContainer.style.textAlign = 'center';
        labelContainer.style.userSelect = 'none';
        labelContainer.style.cursor = 'pointer';
        body.appendChild(labelContainer);
    
    
        let presetIndex = 1;
        const globalDataRange = [0, 255];
        const lookupTable = vtkColorTransferFunction.newInstance();
    
        function changePreset(delta = 1) {
        presetIndex =
            (presetIndex + delta + vtkColorMaps.rgbPresetNames.length) %
            vtkColorMaps.rgbPresetNames.length;
        lookupTable.applyColorMap(
            vtkColorMaps.getPresetByName(vtkColorMaps.rgbPresetNames[presetIndex])
        );
        lookupTable.setMappingRange(...globalDataRange);
        lookupTable.updateRange();
        labelContainer.innerHTML = vtkColorMaps.rgbPresetNames[presetIndex];
        }
    
        let intervalID = null;
        function stopInterval() {
        if (intervalID !== null) {
            clearInterval(intervalID);
            intervalID = null;
        }
        }
    
        labelContainer.addEventListener('click', (event) => {
        if (event.pageX < 200) {
            stopInterval();
            changePreset(-1);
        } else {
            stopInterval();
            changePreset(1);
        }
        });
    
        // ----------------------------------------------------------------------------
        // Example code
        // ----------------------------------------------------------------------------
    
        const widget = vtkPiecewiseGaussianWidget.newInstance({
          numberOfBins: 256,
          size: [400, 150],
          });
          widget.updateStyle({
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          histogramColor: 'rgba(100, 100, 100, 0.5)',
          strokeColor: 'rgb(0, 0, 0)',
          activeColor: 'rgb(255, 255, 255)',
          handleColor: 'rgb(50, 150, 50)',
          buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
          buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
          buttonStrokeColor: 'rgba(0, 0, 0, 1)',
          buttonFillColor: 'rgba(255, 255, 255, 1)',
          strokeWidth: 2,
          activeStrokeWidth: 3,
          buttonStrokeWidth: 1.5,
          handleWidth: 3,
          iconSize: 20, // Can be 0 if you want to remove buttons (dblClick for (+) / rightClick for (-))
          padding: 10,
          });
    
        fullScreenRenderer.setResizeCallback(({ width, height }) => {
        widget.setSize(Math.min(450, width - 10), 150);
        });
    
        const piecewiseFunction = vtkPiecewiseFunction.newInstance();
    
        const actor = vtkVolume.newInstance();
        const mapper = vtkVolumeMapper.newInstance({ sampleDistance: 1.1 });
        const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

        reader.setUrl(link, { loadData: true }).then(() => {
            const imageData = reader.getOutputData();
            const dataArray = imageData.getPointData().getScalars();
            const dataRange = dataArray.getRange();
            globalDataRange[0] = dataRange[0];
            globalDataRange[1] = dataRange[1];

    
            // Update Lookup table
            changePreset();
    
            // Automatic switch to next preset every 5s
            if (!rootContainer) {
            intervalID = setInterval(changePreset, 5000);
            }
    
            widget.setDataArray(dataArray.getData());
            widget.applyOpacity(piecewiseFunction);
    
            widget.setColorTransferFunction(lookupTable);
            lookupTable.onModified(() => {
            widget.render();
            renderWindow.render();
            });
    
            renderer.addVolume(actor);
            renderer.resetCamera();
            renderer.getActiveCamera().elevation(70);
            renderWindow.render();
        });
    
        actor.setMapper(mapper);
        mapper.setInputConnection(reader.getOutputPort());
    
        actor.getProperty().setRGBTransferFunction(0, lookupTable);
        actor.getProperty().setScalarOpacity(0, piecewiseFunction);
        actor.getProperty().setInterpolationTypeToFastLinear();
    
        // ----------------------------------------------------------------------------
        // Default setting Piecewise function widget
        // ----------------------------------------------------------------------------
    
        widget.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
        widget.addGaussian(0.75, 1, 0.3, 0, 0);
    
        widget.setContainer(widgetContainer);
        widget.bindMouseListeners();
    
        widget.onAnimation((start) => {
        if (start) {
            renderWindow.getInteractor().requestAnimation(widget);
        } else {
            renderWindow.getInteractor().cancelAnimation(widget);
        }
        });
    
        widget.onOpacityChange(() => {
            widget.applyOpacity(piecewiseFunction);
            if (!renderWindow.getInteractor().isAnimating()) {
                renderWindow.render();
            }
        });
        return null 
      }, [vtkContainerRef, link]) ;

    return (
        <div>
          <div ref={vtkContainerRef} />
          <table style={{
                    backgroundColor: 'black',
                    color: 'black',
                }}></table>
        </div>
      ); 
    }


// -----------------------------------------------------------
// Image crop section
// -----------------------------------------------------------

  const controlPanel = `
<table>
<tr>
  <td>pickable</td>
  <td>
    <input class='flag' data-name="pickable" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>visibility</td>
  <td>
    <input class='flag' data-name="visibility" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>contextVisibility</td>
  <td>
    <input class='flag' data-name="contextVisibility" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>handleVisibility</td>
  <td>
    <input class='flag' data-name="handleVisibility" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>faceHandlesEnabled</td>
  <td>
    <input class='flag' data-name="faceHandlesEnabled" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>edgeHandlesEnabled</td>
  <td>
    <input class='flag' data-name="edgeHandlesEnabled" type="checkbox" checked />
  </td>
</tr>
<tr>
  <td>cornerHandlesEnabled</td>
  <td>
    <input class='flag' data-name="cornerHandlesEnabled" type="checkbox" checked />
  </td>
</tr>
</table>`
;
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
let ImageCrop= ({link})=>{
  const vtkContainerRef = useRef(null);
  useEffect(() => {
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      rootContainer: vtkContainerRef.current,
      background: [0.6, 0.7, 0.74],
    });
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

    global.renderer = renderer;
    global.renderWindow = renderWindow;

    // ----------------------------------------------------------------------------
    // 2D overlay rendering
    // ----------------------------------------------------------------------------

    const overlaySize = 15;
    const overlayBorder = 2;
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.width = `${overlaySize}px`;
    overlay.style.height = `${overlaySize}px`;
    overlay.style.border = `solid ${overlayBorder}px red`;
    overlay.style.borderRadius = '50%';
    overlay.style.left = '-100px';
    overlay.style.pointerEvents = 'none';
    document.querySelector('body').appendChild(overlay);

    var element1 = document.getElementById("gaussian");
    var element2 = document.getElementById("lblgaussian");

    if (typeof (element1) != 'undefined' && element1 != null) {
        element1.parentNode.removeChild(element1);
    }

    if (typeof (element2) != 'undefined' && element2 != null) {
element2.parentNode.removeChild(element2);
    }

    // ----------------------------------------------------------------------------
    // Widget manager
    // ----------------------------------------------------------------------------

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);

    const widget = vtkImageCroppingWidget.newInstance();

    function widgetRegistration(e) {
    const action = e ? e.currentTarget.dataset.action : 'addWidget';
    const viewWidget = widgetManager[action](widget);
    if (viewWidget) {
        viewWidget.setDisplayCallback((coords) => {
        overlay.style.left = '-100px';
        if (coords) {
            const [w, h] = apiRenderWindow.getSize();
            overlay.style.left = `${Math.round(
            (coords[0][0] / w) * window.innerWidth -
                overlaySize * 0.5 -
                overlayBorder
            )}px`;
            overlay.style.top = `${Math.round(
            ((h - coords[0][1]) / h) * window.innerHeight -
                overlaySize * 0.5 -
                overlayBorder
            )}px`;
        }
        });

        renderer.resetCamera();
        renderer.resetCameraClippingRange();
    }
    widgetManager.enablePicking();
    renderWindow.render();
    }

    // Initial widget register
    widgetRegistration();

    // ----------------------------------------------------------------------------
    // Volume rendering
    // ----------------------------------------------------------------------------

    const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

    const actor = vtkVolume.newInstance();
    const mapper = vtkVolumeMapper.newInstance();
    mapper.setSampleDistance(1.1);
    actor.setMapper(mapper);

    // create color and opacity transfer functions
    const ctfun = vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
    ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
    ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
    ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(0.0, 0.0);
    ofun.addPoint(255.0, 1.0);
    actor.getProperty().setRGBTransferFunction(0, ctfun);
    actor.getProperty().setScalarOpacity(0, ofun);
    actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
    actor.getProperty().setInterpolationTypeToLinear();
    actor.getProperty().setUseGradientOpacity(0, true);
    actor.getProperty().setGradientOpacityMinimumValue(0, 2);
    actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
    actor.getProperty().setGradientOpacityMaximumValue(0, 20);
    actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
    actor.getProperty().setShade(true);
    actor.getProperty().setAmbient(0.2);
    actor.getProperty().setDiffuse(0.7);
    actor.getProperty().setSpecular(0.3);
    actor.getProperty().setSpecularPower(8.0);

    mapper.setInputConnection(reader.getOutputPort());

    // -----------------------------------------------------------
    // Get data
    // -----------------------------------------------------------

    function getCroppingPlanes(imageData, ijkPlanes) {
    const rotation = quat.create();
    mat4.getRotation(rotation, imageData.getIndexToWorld());

    const rotateVec = (vec) => {
        const out = [0, 0, 0];
        vec3.transformQuat(out, vec, rotation);
        return out;
    };

    const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
    const origin = imageData.indexToWorld([iMin, jMin, kMin]);
    // opposite corner from origin
    const corner = imageData.indexToWorld([iMax, jMax, kMax]);
    return [
        // X min/max
        vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
        vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
        // Y min/max
        vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
        vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
        // X min/max
        vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
        vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
    ];
    }

    reader.setUrl(link).then(() => {
    reader.loadData().then(() => {
        const image = reader.getOutputData();

        // update crop widget
        widget.copyImageDataDescription(image);
        const cropState = widget.getWidgetState().getCroppingPlanes();
        cropState.onModified(() => {
        const planes = getCroppingPlanes(image, cropState.getPlanes());
        mapper.removeAllClippingPlanes();
        planes.forEach((plane) => {
            mapper.addClippingPlane(plane);
        });
        mapper.modified();
        });

        // add volume to renderer
        renderer.addVolume(actor);
        renderer.resetCamera();
        renderer.resetCameraClippingRange();
        renderWindow.render();
    });
    });

    // -----------------------------------------------------------
    // UI control handling
    // -----------------------------------------------------------

    fullScreenRenderer.addController(controlPanel);

    function updateFlag(e) {
    const value = !!e.target.checked;
    const name = e.currentTarget.dataset.name;
    widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget

    widgetManager.enablePicking();
    renderWindow.render();
    }

    const elems = document.querySelectorAll('.flag');
    for (let i = 0; i < elems.length; i++) {
        elems[i].addEventListener('change', updateFlag);
    }

    const buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', widgetRegistration);
    }
  }, [vtkContainerRef, link]);
  return (
    <div>
      <div ref={vtkContainerRef} />
    </div>
  );
}
    return(
      <>
      {page == 1?<Isochange link= {pageLink} />:null }
      {page==2?<Gaussian link={pageLink} />:null}
      {page==3?<ImageCrop link={pageLink} />:null} 
      <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          top: '200px',
          right: '50px',
      }}>
      <button class = 'iso' onClick= {e=>{setPage(1)}}>
        Iso Value
      </button>
      <button class = 'iso' onClick= {e=>{setPage(3)}}>
        Image Cropping
      </button>
      <button onClick= {e=>{setPage(2)}}>
        Ray Casting
      </button>
      </div>
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        left: '650px',
      }}>
      <button class = 'dataButtons' onClick= {e=>{setPageLink(trunk)}}>
        trunk
      </button>
        <button class = 'dataButtons' onClick= {e=>{setPageLink(head)}}>
        head
      </button>
      </div>
      
      </>
    )
  }
  export default App